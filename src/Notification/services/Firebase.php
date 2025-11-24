<?php

namespace Lazytask\Notification\services;
class Firebase {

	// sending push message to single user by firebase reg id
	public function send( $to, $message ) {
		$fields = array(
			'message' => array(
				'token'        => $to,
				'notification' => $message,
			),
		);

	  $this->sendPushNotification( $fields );
	}

	// sending push message to multiple users by firebase registration ids
	public function sendMultiple( $registration_ids, $message ) {

		if(is_array($registration_ids) && count($registration_ids) > 0){
			foreach ($registration_ids as $value) {
				$fields = array(
					'message' => array(
						'token' => $value,
						'notification' => $message,
					),
				);
				$this->sendPushNotification($fields);
			}
		}

		return true;
	}

	private function sendPushNotification( $fields ) {
//		define('FIREBASE_API_KEY', 'AIzaSyC9b16pclalKqp1Q67jolO6NI-or2bAXow');

		// Set POST variables
		$url = 'https://fcm.googleapis.com/v1/projects/lazytasks-ee0da/messages:send';

		// Get OAuth 2.0 access token
		$accessToken = $this->getAccessToken();

		$headers = array(
			'Authorization' => 'Bearer ' . $accessToken,
			'Content-Type'  => 'application/json',
		);

// Set up the request arguments for wp_remote_post
		$args = array(
			'method'    => 'POST',
			'body'      => json_encode($fields),  // Convert fields to JSON format
			'headers'   => $headers,              // Attach headers
			'timeout'   => 45,                    // Optional: Set a timeout (default is 5)
			'sslverify' => false                  // Disable SSL verification if necessary (not recommended for production)
		);

// Perform the POST request
		$response = wp_remote_post($url, $args);

// Check if the request returned an error
		if (is_wp_error($response)) {
			$error_message = $response->get_error_message();
			die("Request failed: $error_message");
		}

// Retrieve the response body
		$result = wp_remote_retrieve_body($response);

// Use the result as needed
		return $result;


	}

	public function getAccessToken() {
//		$keyFilePath = 'lazytasks-ee0da-firebase-adminsdk-iu4tv-2e8fef7be4.json';
		$tokenUri    = 'https://oauth2.googleapis.com/token';
		$scopes      = 'https://www.googleapis.com/auth/firebase.messaging';

		$jwt    = $this->createJwt( $scopes );
		$fields = array(
			'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			'assertion'  => $jwt
		);

		$response = wp_remote_post($tokenUri, [
			'body' => http_build_query($fields),
			'headers' => [
				'Content-Type' => 'application/x-www-form-urlencoded',
			],
			'timeout' => 45, // Adjust the timeout as necessary
			'sslverify' => false,
		]);

		if (is_wp_error($response)) {
			$error_message = $response->get_error_message();
			die('Curl failed: ' . $error_message);
		} else {
			$result = wp_remote_retrieve_body($response);
			$response = json_decode($result, true);
		}

		return isset( $response['access_token'] ) ? $response['access_token'] : '';
	}

	private function createJwt( $scopes ) {
		$now = time();
//        $key = json_decode(file_get_contents($keyFilePath), true);
		$lazytaskSettings = get_option('lazytask_settings', []);
		$firebaseConfig = isset($lazytaskSettings['firebase_configuration']) && $lazytaskSettings['firebase_configuration'] ? json_decode($lazytaskSettings['firebase_configuration'], true) : [];
		$clientEmail = isset($firebaseConfig['wordpress_client_email']) && $firebaseConfig['wordpress_client_email'] ? $firebaseConfig['wordpress_client_email'] : '';
		$privateKey = isset($firebaseConfig['wordpress_private_key']) && $firebaseConfig['wordpress_private_key'] ? $firebaseConfig['wordpress_private_key'] : '';

		$key     = [
//			"client_email" => "firebase-adminsdk-iu4tv@lazytasks-ee0da.iam.gserviceaccount.com",
			"client_email" => $clientEmail,
			"private_key"  => $privateKey,
		];
		$header  = array( 'alg' => 'RS256', 'typ' => 'JWT' );
		$expiration_time = $now + 3600; // Token valid for 7 days

		$payload = array(
			'iss'   => $key['client_email'],
			'scope' => $scopes,
			'aud'   => 'https://oauth2.googleapis.com/token',
			'iat'   => $now,
			'exp'   => $expiration_time
		);

		$base64UrlHeader  = str_replace( [ '+', '/', '=' ], [ '-', '_', '' ], base64_encode( json_encode( $header ) ) );
		$base64UrlPayload = str_replace( [ '+', '/', '=' ], [
			'-',
			'_',
			''
		], base64_encode( json_encode( $payload ) ) );

		$signatureInput = $base64UrlHeader . "." . $base64UrlPayload;
		openssl_sign( $signatureInput, $signature, $key['private_key'], 'SHA256' );
		$base64UrlSignature = str_replace( [ '+', '/', '=' ], [ '-', '_', '' ], base64_encode( $signature ) );

		return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
	}

}
