<?php

namespace Lazytask\Notification\services;


class SmsGateWay
{

   public function send($phone, $msg, $sender = ""){

	   $lazytaskSettings = get_option('lazytask_settings', []);
	   $smsConfig = isset($lazytaskSettings['sms_configuration']) && $lazytaskSettings['sms_configuration'] ? json_decode($lazytaskSettings['sms_configuration'], true) : [];
	   $smsServiceProvider = isset($smsConfig['sms_service_provider']) && $smsConfig['sms_service_provider'] ? $smsConfig['sms_service_provider'] : '';
	   if($smsServiceProvider && $smsServiceProvider=='reve') {
		   return $this->sendReveSms($phone, $msg, $sender);
	   }
	   return true;
    }

	private function sendReveSms($phone, $msg, $sender) {

	   $lazytaskSettings = get_option('lazytask_settings', []);
	   $smsConfig = isset($lazytaskSettings['sms_configuration']) && $lazytaskSettings['sms_configuration'] ? json_decode($lazytaskSettings['sms_configuration'], true) : [];
	   $smsApiUrl = isset($smsConfig['sms_api_url']) && $smsConfig['sms_api_url'] ? $smsConfig['sms_api_url'] : '';
	   $smsApiKey = isset($smsConfig['sms_api_key']) && $smsConfig['sms_api_key'] ? $smsConfig['sms_api_key'] : '';
	   $smsSecretKey = isset($smsConfig['sms_api_secret_key']) && $smsConfig['sms_api_secret_key'] ? $smsConfig['sms_api_secret_key'] : '';
	   $smsCallerId = isset($smsConfig['sms_sender_name']) && $smsConfig['sms_sender_name'] ? $smsConfig['sms_sender_name'] : '';
	   if( $smsApiUrl && $smsApiKey && $smsSecretKey && $smsCallerId) {
//		   $api_url = "https://smpp.revesms.com:7790/sendtext";
		   $api_url = $smsApiUrl;
		   $data = [
			   'apikey' => $smsApiKey,
			   'secretkey' => $smsSecretKey,
			   'callerID' => $smsCallerId,
			   'toUser' => $phone,
			   'messageContent' => $msg,
		   ];

		   $response = wp_remote_post($api_url, [
			   'body' => wp_json_encode($data),
			   'headers' => [
				   'Content-Type' => 'application/json',
			   ],
			   'timeout' => 45, // Adjust the timeout as necessary
			   'httpversion' => '1.0',
			   'sslverify' => false,
		   ]);

		   if (is_wp_error($response)) {
			   $error_message = $response->get_error_message();
			   return "Something went wrong: $error_message";
		   } else {
			   $body = wp_remote_retrieve_body($response);
			   // Process the response body as needed
			   return 'success'; // Or return a more detailed success message based on the response body
		   }
	}
	return 'sms configuration not found';
   }
}
