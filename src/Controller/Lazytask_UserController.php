<?php

namespace Lazytask\Controller;

use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use Exception;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

final class Lazytask_UserController {


	public function getAllMembers(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$requestData = $request->get_params();
		$results = $db->get_results("SELECT * FROM `{$wpdb->prefix}users` as users", ARRAY_A);
		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				$roles = $this->getRolesByUser($value['ID']);
				$llc_roles = [];
				if(isset($roles['roles']) && sizeof($roles['roles'])>0){
					$llc_roles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? $roles['roles'] : [];

				}

				$user = get_userdata( $value['ID'] );

// Get all the user roles as an array.
				$user_roles = $user->roles;
				if( $user_roles && in_array('lazytasks_role', $user_roles) && $user->user_status == 0) {
					continue;
				}
				$returnArray[] = [
					'id' => $value['ID'],
					'name' => $value['display_name'],
					'email' => $value['user_email'],
					'username' => $value['user_login'],
					'phoneNumber' => get_user_meta($value['ID'], 'phone_number', true),
					'firstName' => get_user_meta($user->ID, 'first_name', true),
					'lastName' => get_user_meta($user->ID, 'last_name', true),
					'created_at' => $value['user_registered'],
					'avatar' => self::getUserAvatar($value['ID']),
					'roles' => $user_roles,
					'llc_roles' => $llc_roles,
					'llc_permissions' => isset($roles['permissions']) && sizeof($roles['permissions'])>0 ? array_unique($this->array_flatten( $roles['permissions'])) : [],
				];

			}

			if(isset($requestData['company_id']) && $requestData['company_id'] != ''){
				$companyController = new Lazytask_CompanyController();
				$companyMembers = $companyController->getCompanyMembers($requestData['company_id']);
				$companyMembersId = isset($companyMembers[$requestData['company_id']]) && sizeof($companyMembers[$requestData['company_id']]) > 0 ?  array_column($companyMembers[$requestData['company_id']], 'id') : [];
				//  array filter to get only company members an array
				if (sizeof($companyMembersId) > 0) {
					$returnArrayFilter = array_filter($returnArray, function($item) use ($companyMembersId) {
						return in_array($item['id'], $companyMembersId);
					});

					$returnArray = array_values($returnArrayFilter);
				}else{
					$returnArray = [];
				}
			}

			if(isset($requestData['project_id']) && $requestData['project_id'] != ''){
				$projectController = new Lazytask_ProjectController();
				$projectMembers = $projectController->getProjectMembers($requestData['project_id']);
				$projectMembersId = isset($projectMembers[$requestData['project_id']]) && sizeof($projectMembers[$requestData['project_id']]) > 0 ?  array_column($projectMembers[$requestData['project_id']], 'id') : [];
				//  array filter to get only company members an array
				if (sizeof($projectMembersId) > 0) {
					$returnArrayFilter = array_filter($returnArray, function($item) use ($projectMembersId) {
						return in_array($item['id'], $projectMembersId);
					});

					$returnArray = array_values($returnArrayFilter);
				}else{
					$returnArray = [];
				}
			}

			return ['status'=>200, 'data'=>$returnArray, 'requestData'=>$requestData];
		}
		return ['status'=>404, 'data'=>$returnArray];
	}

	public function getAllInvitedMembers(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$requestData = $request->get_params();
		$results = $db->get_results("SELECT * FROM `{$wpdb->prefix}users` as users WHERE users.user_status = 0", ARRAY_A);
		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				$roles = $this->getRolesByUser($value['ID']);
				$llc_roles = [];
				if(isset($roles['roles']) && sizeof($roles['roles'])>0){
					$llc_roles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? $roles['roles'] : [];

				}

				$user = get_userdata( $value['ID'] );

				$user_roles = $user->roles;
				if( $user_roles && in_array('lazytasks_role', $user_roles) && $user->user_status == 0) {
					
					$returnArray[] = [
						'id' => $value['ID'],
						'name' => $value['display_name'],
						'email' => $value['user_email'],
						'username' => $value['user_login'],
						'phoneNumber' => get_user_meta($value['ID'], 'phone_number', true),
						'firstName' => get_user_meta($user->ID, 'first_name', true),
						'lastName' => get_user_meta($user->ID, 'last_name', true),
						'created_at' => $value['user_registered'],
						'avatar' => self::getUserAvatar($value['ID']),
						'roles' => $user_roles,
						'llc_roles' => $llc_roles,
						'llc_permissions' => isset($roles['permissions']) && sizeof($roles['permissions'])>0 ? array_unique($this->array_flatten( $roles['permissions'])) : [],
					];
				}else{
					continue;
				}

			}

			if(isset($requestData['company_id']) && $requestData['company_id'] != ''){
				$companyController = new Lazytask_CompanyController();
				$companyMembers = $companyController->getCompanyMembers($requestData['company_id']);
				$companyMembersId = isset($companyMembers[$requestData['company_id']]) && sizeof($companyMembers[$requestData['company_id']]) > 0 ?  array_column($companyMembers[$requestData['company_id']], 'id') : [];
				//  array filter to get only company members an array
				if (sizeof($companyMembersId) > 0) {
					$returnArrayFilter = array_filter($returnArray, function($item) use ($companyMembersId) {
						return in_array($item['id'], $companyMembersId);
					});

					$returnArray = array_values($returnArrayFilter);
				}else{
					$returnArray = [];
				}
			}

			if(isset($requestData['project_id']) && $requestData['project_id'] != ''){
				$projectController = new Lazytask_ProjectController();
				$projectMembers = $projectController->getProjectMembers($requestData['project_id']);
				$projectMembersId = isset($projectMembers[$requestData['project_id']]) && sizeof($projectMembers[$requestData['project_id']]) > 0 ?  array_column($projectMembers[$requestData['project_id']], 'id') : [];
				//  array filter to get only company members an array
				if (sizeof($projectMembersId) > 0) {
					$returnArrayFilter = array_filter($returnArray, function($item) use ($projectMembersId) {
						return in_array($item['id'], $projectMembersId);
					});

					$returnArray = array_values($returnArrayFilter);
				}else{
					$returnArray = [];
				}
			}

			return ['status'=>200, 'data'=>$returnArray, 'requestData'=>$requestData];
		}
		return ['status'=>404, 'data'=>$returnArray];
	}

	public function show(WP_REST_Request $request){
		$id = $request->get_param('id');

		if(!$id){
			return array('status'=> 500, 'message' => 'Company ID is required', 'data'=>[]);
		}
		$user = $this->getUserById($id);

		if($user && sizeof($user)>0){
			return new WP_REST_Response(['status'=>200, 'data'=>$user]);
		}

		return new WP_REST_Response(['status'=>404, 'data'=>[]]);

	}
	private function getUserById($id){
		if(!$id){
			return [];
		}
		$user = get_userdata( $id );
		if($user == false){
			return [];
		}

		$roles = $this->getRolesByUser($id);
		$user_roles = $user->roles;
	$returnArray = [
		'id' => $user->ID,
		'user_id' => $user->ID, //for apps development
		'name' => $user->display_name,
		'email' => $user->user_email,
		'username' => $user->user_login,
		'phoneNumber' => get_user_meta($user->ID, 'phone_number', true),
		'firstName' => get_user_meta($user->ID, 'first_name', true),
		'lastName' => get_user_meta($user->ID, 'last_name', true),
		'created_at' => $user->user_registered,
		'avatar' => self::getUserAvatar($user->ID),
		'roles' => $user_roles,
		'llc_roles' => isset($roles['roles']) && sizeof($roles['roles'])>0 ? $roles['roles'] : [],
		'llc_permissions' => isset($roles['permissions']) && sizeof($roles['permissions'])>0 ? array_unique($this->array_flatten( $roles['permissions'])) : [],
	];
		return $returnArray;
	}

	public function getRolesByUser($userId) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$userHasRolesTable = LAZYTASK_TABLE_PREFIX . 'user_has_roles';
		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';

		$results = $db->get_results(
			$db->prepare(
				"SELECT roles.id, roles.name , roles.slug 
						FROM `{$userHasRolesTable}` as user_has_roles 
						JOIN `{$rolesTable}` as roles ON user_has_roles.role_id = roles.id 
						WHERE user_has_roles.user_id = %d", (int)$userId), ARRAY_A);
		$returnArray = [];

		if($results){
			foreach ($results as $key => $value) {
				$value['permissions'] = $this->getPermissionByRole($value['id']);
				$returnArray['roles'][] = [
					'id' => $value['id'],
					'name' => $value['name'],
					'slug' => $value['slug'],
				];
				$returnArray['permissions'][] = $value['permissions'];
			}
		}
		return $returnArray;
	}

  private function array_flatten($array) {
		if (!is_array($array)) {
			return FALSE;
		}
		$result = array();
		foreach ($array as $key => $value) {
			if (is_array($value)) {
				$result = array_merge($result, $this->array_flatten($value));
			}
			else {
				$result[$key] = $value;
			}
		}
		return $result;
	}

	private function getPermissionByRole($roleId) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$roleHasPermissionTable = LAZYTASK_TABLE_PREFIX . 'role_has_permissions';
		$permissionTable = LAZYTASK_TABLE_PREFIX . 'permissions';
		$results = $db->get_results($db->prepare("SELECT permissions.name FROM `{$roleHasPermissionTable}` as role_has_permissions JOIN `{$permissionTable}` as permissions ON role_has_permissions.permission_id = permissions.id WHERE role_has_permissions.role_id =%d", (int)$roleId), ARRAY_A);
		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				$returnArray[] = $value['name'];
			}
		}
		return $returnArray;

	}
	public function login( WP_REST_Request $request ){
		$requestData = $request->get_body_params();

		$username = isset($requestData['email']) && $requestData['email'] != "" ? $requestData['email'] : '';
		$password = isset($requestData['password']) && $requestData['password'] != "" ? $requestData['password'] : '';

		// Check if we have a username and password
		if ($username == '' || $password == '') {
			// If not, throw an error
			return [ "status" => 401, "message" => "Username and password required" ];
		}
		// Prepare the credentials for wp_signon()
		$credentials = array(
			'user_login'    => $username,
			'user_password' => $password,
			'remember'      => true
		);

		// Attempt to sign on the user
		$user = wp_signon($credentials, false);

		// Check if there was an error
		if (is_wp_error($user)) {
			// Return the error message
			return $user->get_error_message();
		}

		wp_set_current_user($user->ID, $user->display_name);
		wp_set_auth_cookie($user->ID, true, false);

		$authToken = wp_generate_auth_cookie($user->ID, 86400, 'logged_in', null);
		$user->authToken = $authToken;

		$parseToken = wp_parse_auth_cookie($authToken, 'logged_in');
		$user->parseToken = $parseToken;

		// If successful, return a success message
		return [ "status" => 200, "message" => "User logged in successfully", "data" => $user ];

	}

	// Callback function to generate JWT token
	public function jwt_auth_generate_token(WP_REST_Request $request) {

		$secret_key = defined( 'LAZYTASK_JWT_SECRET_KEY' ) ? LAZYTASK_JWT_SECRET_KEY : false;

		if ( ! $secret_key ) {
			return new WP_REST_Response(array( 'status'=> 403, 'code'=>'jwt_auth_bad_config', 'message'=>__('JWT is not configured properly, please contact the administration', 'lazytasks-project-task-management')));
		}
		
		$requestData = $request->get_json_params();

		$username = $requestData['email'] ? sanitize_text_field($requestData['email']) : '';

		$password = $requestData['password'] ?? '';

		if ( empty( $username ) ) {

			$response = array(
				'status'  => 400,
				'message' => __( "Username is required", 'lazytasks-project-task-management' ),
			);

			return new WP_REST_Response( $response, 400 );

		}

		if ( empty( $password ) ) {

			$response = array(
				'status'  => 400,
				'message' => __( "Password is required", 'lazytasks-project-task-management' ),
			);

			return new WP_REST_Response( $response, 400 );

		}

		$user = get_user_by( 'login', $username );
		if ( ! $user ) {
			$user = get_user_by( 'email', $username );
		}

		if ( ! $user ) {
			// If user not found
			$response = array(
				'status'  => 400,
				'message' => __( "Username is incorrect", 'lazytasks-project-task-management' ),
			);

			return new WP_REST_Response( $response, 400 );
		}

		$passwordCheck = wp_check_password( $password, $user->user_pass, $user->ID );
		if ( ! $passwordCheck ) {
			$response = array(
				'status'  => 401,
				'code'=>'invalid_credentials',
				'message' => __( "Password is incorrect", 'lazytasks-project-task-management' ),
			);

			return new WP_REST_Response( $response, 400 );
		}

		$issued_at = time();
		$expiration_time = $issued_at + 7 * 24 * 60 * 60; // Token valid for 7 days
		$roles = $this->getRolesByUser($user->ID);
		$user_role = $user->roles;

		$token = array(
			'iss'  => get_bloginfo( 'url' ),
			'iat' => $issued_at,
			'exp' => $expiration_time,
			'data' => array(
				'user_id' => $user->ID,
				'name' => $user->display_name,
				'email' => $user->user_email,
				'roles' => array_values($user_role),
				'avatar' => self::getUserAvatar($user->ID),
				'llc_roles' => isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [],
				'llc_permissions' => isset($roles['permissions']) && sizeof($roles['permissions'])>0 ? array_unique($this->array_flatten( $roles['permissions'])) : [],
			),
		);
		//add user meta data for apps development fcm token after login
		$lazytask_fcm_token = $request->get_param('lazytask_fcm_token');
		if($lazytask_fcm_token != ''){
			update_user_meta($user->ID, 'lazytask_fcm_token', $lazytask_fcm_token);
		}
		$userRoles = $user->roles;
		if( in_array('lazytasks_role', $userRoles) && $user->user_status == 0) {
			$this->update_user_status($user->ID, 1);
		}

		$token =  JWT::encode($token, $secret_key, 'HS256');

		return new WP_REST_Response(array( 'status'=> 200, 'code'=>'is_valid', 'message'=> 'Success', 'token' => $token));
	}

   private	function update_user_status($user_id, $status)
   {
	   global $wpdb;
	   $db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
	   $db->update(
		   $db->users,
			['user_status' => $status],
			['ID' => $user_id]
		);
	}

	public function google_login(WP_REST_Request $request)
	{
		$social_login_settings = get_option('lazytask_social_login_settings', []);
		if (
			empty($social_login_settings) ||
			empty($social_login_settings['social_login_enabled']) ||
			empty($social_login_settings['google']['is_enabled'])
		) {
			return new WP_REST_Response([
				'status'  => 403,
				'code'    => 'google_login_disabled',
				'message' => 'Google login is disabled',
			], 403);
		}

		$secret_key = defined( 'LAZYTASK_JWT_SECRET_KEY' ) ? LAZYTASK_JWT_SECRET_KEY : false;

		if ( ! $secret_key ) {
			return new WP_REST_Response(array( 'status'=> 403, 'code'=>'jwt_auth_bad_config', 'message'=>__('JWT is not configured properly, please contact the administration', 'lazytasks-project-task-management')));
		}

		$token = $request->get_param('token');
		if (empty($token)) {
			return new WP_REST_Response(array(
				'status' => 400,
				'code' => 'missing_token',
				'message' => 'Google ID token is required'
			), 400);
		}

		$tokeninfo_url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . $token;

		$google_response = wp_remote_get($tokeninfo_url, [
			'timeout' => 15,
			'sslverify' => true,
		]);

		// $google_response = wp_remote_get('https://oauth2.googleapis.com/tokeninfo?id_token=' . $token);

		if (is_wp_error($google_response)) {
			$error_message = $google_response->get_error_message();
			return new WP_REST_Response(array(
				'status' => 400, 'code' => 'google_verification_failed', 
				'message' => 'Failed to verify Google token' . $error_message
			), 400);
		}

		$body = json_decode(wp_remote_retrieve_body($google_response), true);

		if (!isset($body['email'])) {
			return new WP_REST_Response(array('status' => 401, 'code' => 'invalid_google_token', 'message' => 'Invalid Google token'), 401);
		}

		$email = sanitize_email($body['email']);
		$user = get_user_by('email', $email);
		
		if(!$user){
			return new WP_REST_Response(array( 'status'=> 404, 'code'=>'invalid_email', 'message'=>__('Email not registered', 'lazytasks-project-task-management')));
		}

		$issued_at = time();
		$expiration_time = $issued_at + 7 * 24 * 60 * 60; // Token valid for 7 days
		$roles = $this->getRolesByUser($user->ID);
		$user_role = $user->roles;

		$token = array(
			'iss'  => get_bloginfo( 'url' ),
			'iat' => $issued_at,
			'exp' => $expiration_time,
			'data' => array(
				'user_id' => $user->ID,
				'name' => $user->display_name,
				'email' => $user->user_email,
				'roles' => array_values($user_role),
				'avatar' => self::getUserAvatar($user->ID),
				'llc_roles' => isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [],
				'llc_permissions' => isset($roles['permissions']) && sizeof($roles['permissions'])>0 ? array_unique($this->array_flatten( $roles['permissions'])) : [],
			),
		);
		//add user meta data for apps development fcm token after login
		$lazytask_fcm_token = $request->get_param('lazytask_fcm_token');
		if($lazytask_fcm_token != ''){
			update_user_meta($user->ID, 'lazytask_fcm_token', $lazytask_fcm_token);
		}
		$userRoles = $user->roles;
		if( in_array('lazytasks_role', $userRoles) && $user->user_status == 0) {
			$this->update_user_status($user->ID, 1);
		}

		$token =  JWT::encode($token, $secret_key, 'HS256');

		return new WP_REST_Response(array( 'status'=> 200, 'code'=>'is_valid', 'message'=> 'Success', 'token' => $token));
	}

// Function to generate JWT token
	public function validate_token( WP_REST_Request $request, $permissions=[] ) {

		$auth_header = $request->get_header( 'Authorization' );

		if ( ! $auth_header ) {
			return new WP_Error(
				'jwt_auth_no_auth_header',
				'Authorization header not found.',
				[
					'status' => 403,
				]
			);
		}

		/*
		 * Extract the authorization header
		 */
		[ $token ] = sscanf( $auth_header, 'Bearer %s' );

		/**
		 * if the format is not valid return an error.
		 */
		if ( ! $token ) {
			return new WP_Error(
				'jwt_auth_bad_auth_header',
				'Authorization header is required.',
				[
					'status' => 403,
				]
			);
		}

		/** Get the Secret Key */
		$secret_key = defined( 'LAZYTASK_JWT_SECRET_KEY' ) ? LAZYTASK_JWT_SECRET_KEY : false;
		if ( ! $secret_key ) {
			return new WP_Error(
				'jwt_auth_bad_config',
				'JWT is not configured properly, please contact the administration',
				[
					'status' => 403,
				]
			);
		}

		/** Try to decode the token */
		try {

			$token = JWT::decode( $token, new Key( LAZYTASK_JWT_SECRET_KEY, 'HS256' ) );

			/** The Token is decoded now validate the iss */
			if ( $token->iss !== get_bloginfo( 'url' ) ) {
				/** The iss do not match, return error */
				return new WP_Error(
					'jwt_auth_bad_iss',
					'The iss do not match with this server',
					[
						'status' => 403,
					]
				);
			}

			/** So far so good, validate the user id in the token */
			if ( ! isset( $token->data->user_id ) ) {
				/** No user id in the token, abort!! */
				return new WP_Error(
					'jwt_auth_bad_request',
					'User ID not found in the token',
					[
						'status' => 403,
					]
				);
			}

			if(sizeof($permissions)>0){
				$llc_permissions = $token->data->llc_permissions;
				$intersect = array_intersect($llc_permissions, $permissions);
				if(sizeof($intersect)==0){
					return new WP_Error(
						'jwt_auth_bad_request',
						'You do not have permission to access this resource',
						[
							'status' => 403,

						]
					);
				}
			}

			// check token expiration
			if (time() > $token->exp) {
				return new WP_Error(
					'jwt_auth_bad_request',
					'Token has expired',
					[
						'status' => 408,
					]
				);
			}


			/** This is for the /toke/validate endpoint*/
			return [
				'code' => 'jwt_auth_valid_token',
				'status' => 200,
				'data' => [
					'token' => $token,
					'status' => 200,
				],
			];
		} catch ( Exception $e ) {
			/** Something were wrong trying to decode the token, send back the error */
			return new WP_Error(
				'jwt_auth_invalid_token',
				$e->getMessage(),
				[
					'status' => 403,
				]
			);
		}
	}

	public function decode($token)
	{
		try {
			$token = JWT::decode( $token, new Key( LAZYTASK_JWT_SECRET_KEY, 'HS256' ) );

			/** The Token is decoded now validate the iss */
			if ( $token->iss !== get_bloginfo( 'url' ) ) {
				/** The iss do not match, return error */
				return new WP_Error(
					'jwt_auth_bad_iss',
					'The iss do not match with this server',
					[
						'status' => 403,
					]
				);
			}

			/** So far so good, validate the user id in the token */
			if ( ! isset( $token->data->user_id ) ) {
				/** No user id in the token, abort!! */
				return new WP_Error(
					'jwt_auth_bad_request',
					'User ID not found in the token',
					[
						'status' => 403,
					]
				);
			}
			return [
				'code' => 'jwt_auth_valid_token',
				'status' => 200,
				'data' => [
					'user_id' => $token->data->user_id,
					'name' => $token->data->name,
					'email' => $token->data->email,
					'avatar' => $token->data->avatar,
					'roles' => $token->data->roles,
					'llc_roles' => $token->data->llc_roles,
					'llc_permissions' => $token->data->llc_permissions,
				],
			];
		} catch (Exception $e) {
			return [
				'code' => 'jwt_auth_invalid_token',
				'status' => 403,
				'message' => $e->getMessage(),
			];
		}
	}

	// function logout_user() {
	// 	header("Access-Control-Allow-Origin: *");
	// 	session_destroy();
	// 	wp_logout();
	// 	wp_clear_auth_cookie();
	// 	return [ "status" => 200, "message" => "User logged out successfully", "user_id"=>null ];
	// }

	public function logout_user(WP_REST_Request $request) 
	{

		$secret_key = defined('LAZYTASK_JWT_SECRET_KEY') ? LAZYTASK_JWT_SECRET_KEY : false;

		$auth_header = $request->get_header('authorization');

		if (!$auth_header) {
			return new WP_REST_Response([
				'status'  => 400,
				'message' => 'Authorization token missing',
			], 400);
		}

		// Extract token
		list($jwt) = sscanf($auth_header, 'Bearer %s');

		if (!$jwt) {
			return new WP_REST_Response([
				'status'  => 400,
				'message' => 'Invalid token',
			], 400);
		}

		try {
			$decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
			$user_id = $decoded->data->user_id;
		} catch (Exception $e) {
			return new WP_REST_Response([
				'status'  => 401,
				'message' => 'Invalid or expired token',
			], 401);
		}

		// Delete FCM token on logout
		delete_user_meta($user_id, 'lazytask_fcm_token');

		wp_clear_auth_cookie();

		return new WP_REST_Response([
			'status'  => 200,
			'message' => 'User logged out successfully',
			'user_id' => null,
		], 200);
	}


	public function lazytask_forget_password_request(WP_REST_Request $request) {
		$email = sanitize_email($request->get_param('email'));
		if (!email_exists($email)) {
			return new WP_REST_Response([
				'status'=>404,
				'message'=>'No user found with this email address.'
			], 200);
		}

		// Generate password reset key and send email
		$user = get_user_by('email', $email);
		$key = get_password_reset_key($user);

		$lazytask_page_id = get_option('lazytask_page_id');
		$post = get_post($lazytask_page_id);
		if (!$post) {
			return new WP_REST_Response(['status'=>500, 'message'=>'LazyTasks page not found. Please contact admin.'], 500);
		}
		$parma_link = get_permalink($post->ID);
		$reset_url = $parma_link."/#/change-password/?key=".$key."&login=".rawurlencode($user->user_login);

		// Send email to user with the reset link
		// wp_mail($user->user_email, 'Password Reset Request', 'Click the following link to reset your password: ' . $reset_url);
		$subject = 'Password Reset Request';

		$message = "
		<html>
		<body style='font-family: Arial, sans-serif; color: #333;'>
			<p>Hello {$user->display_name},</p>

			<p>We received a request to reset the password associated with your account.</p>

			<p>If you initiated this request, please click the button below to reset your password:</p>

			<p>
				<a href='{$reset_url}' 
				style='display: inline-block; background-color: #ED7D31; color: #fff;
						padding: 8px 13px; text-decoration: none; border-radius: 4px;'>
					Reset Password
				</a>
			</p>

			<p>If the button does not work, copy and paste the following link into your browser:</p>
			<p><a href='{$reset_url}'>{$reset_url}</a></p>

			<p>If you did not request a password reset, please ignore this message. Your account will remain secure.</p>

			<p>Thank you,<br>Support Team</p>
		</body>
		</html>
		";

		$headers = array('Content-Type: text/html; charset=UTF-8');

		wp_mail($user->user_email, $subject, $message, $headers);


		return new WP_REST_Response(['status'=>200, 'message'=>'Password reset email sent. Please check'], 200);
	}

	public function lazytask_change_password(WP_REST_Request $request) 
	{

		$current_password = trim($request->get_param('currentPassword'));
		$new_password = trim($request->get_param('newPassword'));
		$confirm_password = trim($request->get_param('confirmPassword'));
		$user_id = intval($request->get_param('user_id'));


		// Verify current password
		$user = get_userdata($user_id);
		if (empty($user->user_pass)) {
			return new WP_REST_Response(['status' => 400, 'message' => 'User password is not set.'], 400);
		}		

		if (!wp_check_password($current_password, $user->user_pass, $user_id)) {
			return new WP_REST_Response(['status' => 400, 'message' => 'Current password is incorrect.'], 400);
		}

		// Update the password
		wp_set_password($new_password, $user_id);

		return new WP_REST_Response(['status'=>200, 'message'=>'Password changed successfully.'], 200);
	}

	public function lazytask_forget_password_store(WP_REST_Request $request) {
		$key = sanitize_text_field($request->get_param('key'));
		$login = sanitize_text_field($request->get_param('login'));
		$new_password = $request->get_param('password');

		$user = check_password_reset_key($key, $login);
		if (is_wp_error($user)) {
			return new WP_REST_Response(['status'=>404, 'message'=>'Invalid key.'], 404);
		}

		reset_password($user, $new_password);

		return new WP_REST_Response(['status'=>200, 'message'=>'Password has been reset.'], 200);
	}

	public function permission_check(WP_REST_Request $request, $permissions=[])
	{

		$response = $this->validate_token($request, $permissions);
//		var_dump($response);die;
		if (is_wp_error($response)) {
			return $response;
		}
		return true;
	}

  public function admin_after_auth_login () {

	  $secret_key = defined( 'LAZYTASK_JWT_SECRET_KEY' ) ? LAZYTASK_JWT_SECRET_KEY : false;

      $userId = is_user_logged_in() && is_admin() ? get_current_user_id() : '';

		if(!$userId){
			return new WP_Error('invalid_credentials', __('Invalid credentials', 'lazytasks-project-task-management'), array('status' => 401));
		}
		$user = get_user_by('ID', $userId );

	  if (is_wp_error($user)) {
		  return new WP_Error('invalid_credentials', __('Invalid credentials', 'lazytasks-project-task-management'), array('status' => 401));
	  }

	  $issued_at = time();
	  $expiration_time = $issued_at + 7 * 24 * 60 * 60; // Token valid for 7 days
	  $roles = $this->getRolesByUser($user->ID);

	  $token = array(
		  'iss'  => get_bloginfo( 'url' ),
		  'iat' => $issued_at,
		  'exp' => $expiration_time,
		  'data' => array(
			  'user_id' => $user->ID,
			  'name' => $user->display_name,
			  'email' => $user->user_email,
			  'avatar' => self::getUserAvatar($user->ID),
			  'roles' => $user->roles,
			  'llc_roles' => isset($roles['roles']) && sizeof($roles['roles'])>0 ? $this->array_unique_by_key( $roles['roles'], 'slug') : [],
			  'llc_permissions' => isset($roles['permissions']) && sizeof($roles['permissions'])>0 ? array_unique($this->array_flatten( $roles['permissions'])) : [],
		  ),
	  );

	  $token =  JWT::encode($token, $secret_key, 'HS256');

	  return new WP_REST_Response(array('token' => $token, 'user'=>$user));
	}

   private function array_unique_by_key(array $array, string $key): array {
		$seen = [];
		return array_values(array_filter($array, function($item) use ($key, &$seen) {
			if (in_array($item[$key], $seen, true)) {
				return false; // duplicate → skip
			}
			$seen[] = $item[$key];
			return true; // first occurrence → keep
		}));
	}

	public function createLazyLinkRole(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';

		$created_at = current_time('mysql');
		$name = sanitize_text_field($request->get_param('name'));
		$slug = sanitize_title($name); // generate slug from name

		if (empty($name)) {
			return rest_ensure_response([
				'status' => 422,
				'message' => 'Role name is required'
			]);
		}

		// Check if role already exists
		$existing = $db->get_row($db->prepare(
			"SELECT * FROM {$rolesTable} WHERE name = %s", $name
		), ARRAY_A);

		if (!$existing) {
			// Insert the role
			$inserted = $db->insert(
				$rolesTable,
				['name' => $name, 'slug' => $slug, 'created_at' => $created_at],
				['%s', '%s', '%s']
			);

			if (!$inserted) {
				return rest_ensure_response([
					'status' => 500,
					'message' => 'Failed to insert role'
				]);
			}
		}else{
			return rest_ensure_response([
				'status' => 409,
				'message' => 'Role already exists'
			]);
		}

		// Return all roles
		$results = $db->get_results("SELECT id, name, slug FROM {$rolesTable} WHERE deleted_at IS NULL", ARRAY_A);

		return rest_ensure_response([
			'status' => 200,
			'data' => $results
		]);
	}

	public function updateLazyLinkRole(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';

		$id = $request->get_param('id');
		$updated_at = current_time('mysql');
		$name = sanitize_text_field($request->get_param('name'));
		$slug = sanitize_title($name); // generate slug from name

		if (empty($name)) {
			return rest_ensure_response([
				'status' => 422,
				'message' => 'Role name is required'
			]);
		}

		// Check if role exists
		$existing = $db->get_row($db->prepare(
			"SELECT * FROM {$rolesTable} WHERE id = %d", $id
		), ARRAY_A);

		if (!$existing) {
			return rest_ensure_response([
				'status' => 404,
				'message' => 'Role not found'
			]);
		}
		
		// Update the role
		$updated = $db->update(
			$rolesTable,
			['name' => $name, 'slug' => $slug, 'updated_at' => $updated_at],
			['id' => $id],
			['%s', '%s', '%s'],
			['%d']
		);

		// Return all roles
		$results = $db->get_results("SELECT id, name, slug FROM {$rolesTable}", ARRAY_A);

		return rest_ensure_response([
			'status' => 200,
			'data' => $results
		]);

	}

	public function deleteLazyLinkRole(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';
		$userHasRolesTable = LAZYTASK_TABLE_PREFIX . 'user_has_roles';

		$id = $request->get_param('id');
		$deleted_at = current_time('mysql');

		// Check if role exists
		$existing = $db->get_row($db->prepare(
			"SELECT * FROM {$rolesTable} WHERE id = %d", $id
		), ARRAY_A);

		if (!$existing) {
			return rest_ensure_response([
				'status' => 404,
				'message' => 'Role not found'
			]);
		}

		$checkRole = $db->get_row($db->prepare(
			"SELECT * FROM {$userHasRolesTable} WHERE role_id = %d", $id
		), ARRAY_A);

		if($checkRole){
			return rest_ensure_response([
				'status' => 422,
				'message' => 'Role is assigned to users, cannot delete'
			]);
		}

		$deleted = $db->update(
			$rolesTable,
			['deleted_at' => $deleted_at],
			['id' => $id],
			['%s'],
			['%d']
		);

		if ($deleted === false) {
			return rest_ensure_response([
				'status' => 500,
				'message' => 'Failed to delete role. Please try again.',
			]);
		}

		$results = $db->get_results("SELECT id, name, slug FROM {$rolesTable} WHERE deleted_at IS NULL", ARRAY_A);

		return rest_ensure_response([
			'status' => 200,
			'message' => 'Role deleted successfully',
			'data' => $results
		]);
	}

	
	public function lazyLinkRoles() {

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';

		$results = $db->get_results("SELECT * FROM {$rolesTable} WHERE deleted_at IS NULL", ARRAY_A);
		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				$returnArray[] = [
					'id' => $value['id'],
					'name' => $value['name'],
					'slug' => $value['slug'],
				];
			}
			return new WP_REST_Response(array('status' => 200, 'data'=>$returnArray));
		}
		return new WP_REST_Response(array('status' => 404, 'data'=>$returnArray));
	}
	
	public function lazyLinkPermissions() {

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$permissionsTable = LAZYTASK_TABLE_PREFIX . 'permissions';

		$results = $db->get_results("SELECT * FROM {$permissionsTable}", ARRAY_A);
		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				$returnArray[] = [
					'id' => $value['id'],
					'name' => $value['name'],
					'description' => $value['description'],
					'group' => $value['permission_group'],
				];
			}
			return new WP_REST_Response(array('status' => 200, 'data'=>$returnArray));
		}
		return new WP_REST_Response(array('status' => 404, 'data'=>$returnArray));
	}

	public function getRolePermissions(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$roleHasPermissionTable = LAZYTASK_TABLE_PREFIX . 'role_has_permissions';
		$permissionsTable = LAZYTASK_TABLE_PREFIX . 'permissions';
		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';

		$query = "
			SELECT 
				role.id as role_id,
				role.name as role_name,
				role.slug as role_slug,
				permission.id as permission_id,
				permission.name as permission_name,
				permission.description as permission_description
			FROM {$rolesTable} role
			LEFT JOIN {$roleHasPermissionTable} role_has_permission ON role.id = role_has_permission.role_id
			LEFT JOIN {$permissionsTable} permission ON role_has_permission.permission_id = permission.id
			WHERE role.deleted_at IS NULL
			ORDER BY role.id ASC
		";

		$results = $db->get_results($query, ARRAY_A);
		if (!$results) {
			return new WP_REST_Response([
				'status' => 404,
				'message' => 'No roles found',
				'data' => []
			]);
		}
		
		$roles = [];

		foreach ($results as $row) {
			$roleId = $row['role_id'];

			if (!isset($roles[$roleId])) {
				$roles[$roleId] = [
					'id' => $roleId,
					'name' => $row['role_name'],
					'slug' => $row['role_slug'],
					'permissions' => []
				];
			}

			if ($row['permission_id']) {
				$roles[$roleId]['permissions'][] = [
					'id' => $row['permission_id'],
					'name' => $row['permission_name'],
					'description' => $row['permission_description']
				];
			}
		}

		return new WP_REST_Response([
			'status' => 200,
			'data' => array_values($roles)
		]);
	}

	public function updateRolePermissions(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$rolesData = $request->get_param('roles');

		if (!is_array($rolesData)) {
			return new WP_REST_Response([
				'status' => 400,
				'message' => 'Invalid parameters'
			]);
		}

		$table = LAZYTASK_TABLE_PREFIX . 'role_has_permissions';
		$db->query('START TRANSACTION');

		try {
			foreach ($rolesData as $roleData) {
				$this->updateSingleRolePermissions($db, $table, $roleData);
			}

			$db->query('COMMIT');
			return new WP_REST_Response([
				'status' => 200,
				'message' => 'All permissions updated successfully',
				'data' => ['roles' => $rolesData]
			]);

		} catch (Exception $e) {
			$db->query('ROLLBACK');
			return new WP_REST_Response([
				'status' => 500,
				'message' => 'Failed to update permissions'
			]);
		}
	}

	private function updateSingleRolePermissions($db, $table, $roleData) {
		$roleId = $roleData['id'];
		$newPermissions = array_column($roleData['permissions'] ?? [], 'id');
		
		// ✅ Always force 'view-only-access' permission
		$permissionTable = LAZYTASK_TABLE_PREFIX . 'permissions';
		$viewOnlyPermissionId = $db->get_var(
			$db->prepare("SELECT id FROM $permissionTable WHERE name = %s", 'view-only-access')
		);
		if ($viewOnlyPermissionId && !in_array($viewOnlyPermissionId, $newPermissions)) {
			$newPermissions[] = $viewOnlyPermissionId;
		}

		// Get current permission IDs from DB
		$existingPermissions = $db->get_col(
			$db->prepare(
				"SELECT permission_id FROM $table WHERE role_id = %d",
				$roleId
			)
		);

		// Compute differences
		$toAdd = array_diff($newPermissions, $existingPermissions);
		$toDelete = array_diff($existingPermissions, $newPermissions);

		// Delete removed permissions
		if (!empty($toDelete)) {
			$placeholders = implode(',', array_fill(0, count($toDelete), '%d'));
			$query = $db->prepare(
				"DELETE FROM $table WHERE role_id = %d AND permission_id IN ($placeholders)",
				array_merge([$roleId], $toDelete)
			);
			$db->query($query);
		}

		// Insert new permissions
		foreach ($toAdd as $permissionId) {
			$db->insert(
				$table,
				[
					'role_id' => $roleId,
					'permission_id' => $permissionId
				],
				['%d', '%d']
			);
		}
	}

	public function signUp(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$response = array();
		$parameters = $request->get_json_params();
		$username = sanitize_text_field($parameters['email']);
		$firstName = sanitize_text_field($parameters['firstName']);
		$lastName = sanitize_text_field($parameters['lastName']);
		$phoneNumber = sanitize_text_field($parameters['phoneNumber']);
		$loggedInUserId = $parameters['loggedInUserId'] ? (int)$parameters['loggedInUserId'] : null;
		$roles = $parameters['roles'];
//		$roles = isset($parameters['roles']) && sizeof($parameters['roles']) > 0 ? json_decode($parameters['roles'], true) : [];
		$email = sanitize_text_field($parameters['email']);
		$random_password = wp_generate_password(10, true, false);
		$password = isset($parameters['password']) && $parameters['password']!=''? sanitize_text_field($parameters['password']): $random_password;
		// $role = sanitize_text_field($parameters['role']);
		$error = new WP_Error();
		if (empty($username)) {
			$error->add(400, __("Username field 'username' is required.", 'lazytasks-project-task-management'), array('status' => 400));
			return $error;
		}
		if (empty($email)) {
			$error->add(401, __("Email field 'email' is required.", 'lazytasks-project-task-management'), array('status' => 400));
			return $error;
		}
		if (empty($password)) {
			$error->add(404, __("Password field 'password' is required.", 'lazytasks-project-task-management'), array('status' => 400));
			return $error;
		}
		$nickname= '';
		if($firstName){
			$nickname .= strtolower($firstName);
		}
		if($lastName){
			$nickname .= '-';
			$nickname .= strtolower($lastName);
		}
		$user_id = username_exists($username);
		if (!$user_id && email_exists($email) == false) {
			$db->query('START TRANSACTION');

			$args = array (
				'user_login'     => $username,
				'user_pass'      => $password, //send as plain text password string
				'user_email'     => $email,
				'user_nicename'       => $nickname,
				'display_name'   => $firstName . ' ' . $lastName,
				'user_registered' => current_time('mysql'),
			);
			$user_id = wp_insert_user($args);
			if (!is_wp_error($user_id)) {
				$user = get_user_by('ID', $user_id);
				$user->set_role('lazytasks_role');
				update_user_meta($user_id, 'first_name', $firstName);
				update_user_meta($user_id, 'last_name', $lastName);
				add_user_meta($user_id, 'phone_number', $phoneNumber, true);
				if($roles){
					//wp_capabilities
					add_user_meta($user_id, 'lazytasks_capabilities', $roles, true);
					$this->addUserRole($user_id, $roles);
				}
				$db->query('COMMIT');
				$loggedInUser = get_user_by('ID', $loggedInUserId);
				$referenceInfo = ['id'=>$user_id, 'name'=>$firstName . ' ' . $lastName, 'type'=>'user'];
				$lazytask_page_id = get_option('lazytask_page_id');
				$post = get_post($lazytask_page_id);
				$loginUrl = $post ? get_permalink($post->ID) : '';
				$placeholdersArray = ['name'=>$loggedInUser?$loggedInUser->display_name:'', 'username'=>$email, 'password'=>$password, 'login_url'=>$loginUrl];

				do_action('lazytask_user_registration', $referenceInfo, ['web-app', 'email', 'sms'], [$user_id], $placeholdersArray);

				$user = $this->getUserById($user_id);

				if($user && sizeof($user)>0){
					return new WP_REST_Response(['status'=>200, 'message'=>'Registration has been Successfully', 'data'=>$user]);
				}
				return new WP_REST_Response(['status'=>404, 'message'=>__("User not found", "lazytasks-project-task-management")]);
				}
			return new WP_REST_Response(['status'=>500, 'message'=>__("User Registration Failed", "lazytasks-project-task-management")]);
			} else {
			//email already exists
			return new WP_REST_Response(['status'=>409, 'message'=>__("User already exists", "lazytasks-project-task-management")]);
			}
		}

	public function update(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$response = array();
		$parameters = $request->get_body_params();

		$id = $request->get_param('id');

		if(!$id){
			return array('status'=> 500, 'message' => 'User ID is required', 'data'=>[]);
		}
		$username = sanitize_text_field($parameters['email']);
		$firstName = sanitize_text_field($parameters['firstName']);
		$lastName = sanitize_text_field($parameters['lastName']);
		$phoneNumber = sanitize_text_field($parameters['phoneNumber']);
		$roles = isset($parameters['roles']) && $parameters['roles']!='' ? json_decode($parameters['roles'], true) : [];
		$email = sanitize_text_field($parameters['email']);
//		$password = isset($parameters['password']) && $parameters['password']!=''? sanitize_text_field($parameters['password']): '123456';
		// $role = sanitize_text_field($parameters['role']);
		$error = new WP_Error();
		if (empty($username)) {
			$error->add(400, __("Username field 'username' is required.", 'lazytasks-project-task-management'), array('status' => 400));
			return $error;
		}
		if (empty($email)) {
			$error->add(401, __("Email field 'email' is required.", 'lazytasks-project-task-management'), array('status' => 400));
			return $error;
		}

		$nickname= '';
		if($firstName){
			$nickname .= strtolower($firstName);
		}
		if($lastName){
			$nickname .= '-';
			$nickname .= strtolower($lastName);
		}
		$user_id = username_exists($username);
		$userIdByEmail = email_exists($email);

		if ((!$user_id ||  $user_id==$id) && (!$userIdByEmail ||  $userIdByEmail==$id)) {
			$db->query('START TRANSACTION');

			$args = array (
				'ID'     => (int)$id,
				'user_login'     => $username,
				'user_email'     => $email,
				'user_nicename'       => $nickname,
				'display_name'   => $firstName . ' ' . $lastName,
			);
			$userId = wp_update_user($args);

			if (!is_wp_error($userId)) {
				$user = get_user_by('ID', $userId);

				update_user_meta($userId, 'first_name', $firstName);
				update_user_meta($userId, 'last_name', $lastName);

				update_user_meta($userId, 'phone_number', $phoneNumber);
				if($roles){
					update_user_meta($userId, 'lazytasks_capabilities', $roles);

					$this->addUserRole($userId, $roles);
				}

				// Handle file upload
				$requestFile = $request->get_file_params();
				if (isset($requestFile['file']) && $requestFile['file']) {
					require_once(ABSPATH . 'wp-admin/includes/file.php');
					$uploadedfile = $requestFile['file'];
					$upload_overrides = array('test_form' => false);

					$moveFile = wp_handle_upload($uploadedfile, $upload_overrides);

					if($moveFile){
						$attachment = array(
							'post_author' => $userId,
							'post_title' => $uploadedfile['name'],
							'post_content' => '',
							'post_status' => 'inherit',
							'post_mime_type' => image_type_to_mime_type(exif_imagetype($moveFile['file']))
						);

						$attachment_id = wp_insert_attachment($attachment, $moveFile['file']);

						require_once(ABSPATH . 'wp-admin/includes/image.php');
						$attach_data = wp_generate_attachment_metadata($attachment_id, $moveFile['file']);
						wp_update_attachment_metadata($attachment_id, $attach_data);

						update_user_meta($userId, 'profile_photo', $moveFile['url']);
						update_user_meta($userId, 'profile_photo_id', $attachment_id);

					}
				}


				$db->query('COMMIT');

				$user = $this->getUserById($id);

					if($user && sizeof($user)>0){
						return new WP_REST_Response(['status'=>200, 'message'=>'Update has been Successfully', 'data'=>$user]);
					}
					return new WP_REST_Response(['status'=>404, 'message'=>__("User not found", "lazytasks-project-task-management")]);
				}
			}
			return new WP_REST_Response(['status'=>500, 'message'=>__("User Update Failed", "lazytasks-project-task-management")]);
		}

		public function userRoleUpdate(WP_REST_Request $request) {
			global $wpdb;
			$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
			$parameters = $request->get_body_params();
			$id = $request->get_param('id');
		
			if (!$id) {
				return new WP_REST_Response([
					'status' => 400,
					'message' => 'User ID is required',
					'data' => []
				]);
			}
		
			$roles = isset($parameters['roles']) && $parameters['roles'] != '' ? json_decode($parameters['roles'], true) : [];
		
			if (empty($roles)) {
				return new WP_REST_Response([
					'status' => 400,
					'message' => 'Roles data is required',
					'data' => []
				]);
			}
		
			$user = get_user_by('ID', $id);
			if (!$user) {
				return new WP_REST_Response([
					'status' => 404,
					'message' => 'User not found',
					'data' => []
				]);
			}
				
			// Save roles in meta
			update_user_meta($id, 'lazytasks_capabilities', $roles);
		
			$this->addUserRole($id, $roles);
		
			// Return updated user info
			$user = $this->getUserById($id);
		
			return new WP_REST_Response([
				'status' => 200,
				'message' => 'User roles updated successfully',
				'data' => $user
			]);
		}
		

		private function addUserRole($userId, $roles) {
			if(sizeof($roles)>0){
				global $wpdb;
				$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
				$userHasRoles = LAZYTASK_TABLE_PREFIX . 'user_has_roles';
				$db->delete($userHasRoles, array('user_id' => $userId));
				foreach ( $roles as $role ) {
					$db->insert($userHasRoles, array(
						"user_id" => (int)$userId,
						"role_id" => $role['id'],
					));
				}
			}
		}

		public function getTaskByLoggedInUserId(WP_REST_Request $request) {
			global $wpdb;
			$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
			$projectTable = LAZYTASK_TABLE_PREFIX . 'projects';
			
			$userId = $request->get_param( 'id' );

			$requestData = $request->get_params();

			$projectsByUser = $this->getProjectsByUserId($userId);
			$allProjects = $this->getAllProjects();

			$taskController = new Lazytask_TaskController();
			$tasks = $taskController->getTasksByAssignedUserId($userId, $requestData);
			
			$returnArray = [];
			$columns = ['all'=>'All','overdue'=>'Overdue', 'today'=>'Today', 'nextSevenDays'=>'7 Days', 'upcoming'=>'Upcoming'];

			if($tasks && isset($tasks['data']) && sizeof($tasks['data'])>0){
				$currentDate = gmdate('Y-m-d');
				$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
				//all tasks
				$returnArray['all'] = $tasks['data'];
				foreach ($tasks['data'] as $key => $value) {
					if($value['end_date'] < $currentDate){
						$value['my_task_section'] = 'overdue';
						$returnArray['overdue'][] = $value;
					}elseif($value['end_date'] == $currentDate){
						$value['my_task_section'] = 'today';
						$returnArray['today'][] = $value;
					}elseif($value['end_date'] > $currentDate && $value['end_date'] <= $next7Days){
						$value['my_task_section'] = 'nextSevenDays';
						$returnArray['nextSevenDays'][] = $value;
					}else{
						$value['my_task_section'] = 'upcoming';
						$returnArray['upcoming'][] = $value;
					}
				}
				$data['tasks'] = $returnArray;
				$data['taskSections'] = $columns;
				$data['orders'] = array_keys(array_unique($columns));
				$data['childTasks'] = isset($tasks['childData']) ? $tasks['childData'] : null;
				$data['userProjects'] = isset($projectsByUser['projects'][$userId]) && sizeof($projectsByUser['projects'][$userId]) > 0 ? array_values($projectsByUser['projects'][$userId]) : [];
				$data['taskStatus'] = isset($projectsByUser['taskStatus']) && sizeof($projectsByUser['taskStatus']) > 0 ? array_values($projectsByUser['taskStatus']) : [];
				$data['allTasks'] = $tasks['data'] ? $tasks['data'] : [];
				$data['allProjects'] = array_values($allProjects['projects']['all']);
				
				return new WP_REST_Response(['status'=>200, 'data'=>$data]);
			}
			$data['userProjects'] = isset($projectsByUser[$userId]) && sizeof($projectsByUser[$userId]) > 0 ? array_values($projectsByUser[$userId]) : [];
			$data['taskStatus'] = isset($projectsByUser['taskStatus']) && sizeof($projectsByUser['taskStatus']) > 0 ? array_values($projectsByUser['taskStatus']) : [];
			$data['allProjects'] = array_values($allProjects['projects']['all']);

			return new WP_REST_Response(['status'=>404, 'data'=>$data]);

		}
		public function getQuickTaskByLoggedInUserId(WP_REST_Request $request) {
			$userId = $request->get_param( 'id' );

			$taskController = new Lazytask_TaskController();
			$tasks = $taskController->getQuickTaskByUserId($userId);
			if($tasks && sizeof($tasks)>0){
				return new WP_REST_Response(['status'=>200, 'data'=>$tasks]);
			}

			return new WP_REST_Response(['status'=>404, 'data'=>[]]);

		}

		// get companies by user id
		public function getCompaniesByUserId($userId){
			global $wpdb;
			$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
			$usersTable = $wpdb->prefix . 'users';
			$companyMembersTable = LAZYTASK_TABLE_PREFIX . 'companies_users';
			$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';

			if (is_array($userId)) {
				$ids = implode(', ', array_fill(0, count($userId), '%s'));
			}else{
				$ids = '%s';
				$userId = [$userId];
			}

			$sql = "SELECT companies.* FROM `{$usersTable}` as users
				JOIN `{$companyMembersTable}` as companyMembers  ON users.ID = companyMembers.user_id
						JOIN `{$companyTable}` as companies ON companyMembers.company_id = companies.id
			WHERE companies.deleted_at IS NULL and companyMembers.user_id IN ($ids) group by companies.id";

			$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $userId));

			$results = $db->get_results(
				$query, ARRAY_A);

			$returnArray = [];
			if($results){
				$returnArray = $results;
			}
			return $returnArray;
		}


	public function getProjectsByUserId($userId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		if($userId == ''){
			return [];
		}
		$usersTable = $wpdb->prefix . 'users';
		$projectMembersTable = LAZYTASK_TABLE_PREFIX . 'projects_users';
		$projectTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';

		if (is_array($userId)) {
			$ids = implode(', ', array_fill(0, count($userId), '%s'));
		}else{
			$ids = '%s';
			$userId = [$userId];
		}

		$sql = "SELECT users.ID as userId, users.display_name as userName, projects.id as projectId, projects.name as projectName, projects.company_id as companyId FROM `{$usersTable}` as users
			JOIN `{$projectMembersTable}` as projectMembers  ON users.ID = projectMembers.user_id
         			JOIN `{$projectTable}` as projects ON projectMembers.project_id = projects.id
		WHERE projects.status = 1 AND projectMembers.user_id IN ($ids)";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $userId));

		$results = $db->get_results(
			$query, ARRAY_A);

		$projectIds = array_unique(array_column($results, 'projectId'));
		$projectObj = new Lazytask_ProjectController();
		$totalTasks = $projectObj->getNoOfTasksByProject($projectIds, true);
		$taskStatus = isset($totalTasks['statusData']) ? $totalTasks['statusData'] : [];

		$returnArray = [];
		if($results){

			foreach ($results as $key => $value) {
				$projectId = $value['projectId'];
            	$companyId = $value['companyId'];

				// Get company name
				$companyName = '';
				if ($companyId) {
					$companyRow = $db->get_row($db->prepare("SELECT name FROM {$companyTable} WHERE id = %d", $companyId), ARRAY_A);
					$companyName = $companyRow ? $companyRow['name'] : '';
				}

				// Get project members
				$projectController = new Lazytask_ProjectController();
				$projectMembers = $projectController->getProjectMembers($projectId);
				$flatMembers = array_reduce($projectMembers, 'array_merge', []);

				$membersData = [];
				foreach ($flatMembers as $member) {
						$membersData[] = [
                            'id' => $member['id'],
                            'name' => $member['name'] ?? ($member['display_name'] ?? ''),
                            'avatar' => Lazytask_UserController::getUserAvatar($member['id']),
                        ];
				}

				$returnArray[$value['userId']][$value['projectId']]['id'] = $value['projectId'];
				$returnArray[$value['userId']][$value['projectId']]['name'] = $value['projectName'];
				$returnArray[$value['userId']][$value['projectId']]['company_name'] = $companyName;
				$returnArray[$value['userId']][$value['projectId']]['members'] = $membersData;

				if(sizeof($taskStatus) > 0){
					$returnArray[$value['userId']][$value['projectId']]['total_tasks'] = isset($totalTasks['recordData'][$projectId]) ? array_sum($totalTasks['recordData'][$projectId]) : 0;
					foreach ( $taskStatus as $task_status ) {
						$returnArray[$value['userId']][$value['projectId']][$task_status] = isset($totalTasks['recordData'][$value['projectId']]) && isset($totalTasks['recordData'][$value['projectId']][$task_status]) ? $totalTasks['recordData'][$value['projectId']][$task_status] : "0";
					}
					$returnArray[$value['userId']][$value['projectId']]['OVERDUE'] = $totalTasks['recordData'][$value['projectId']]['OVERDUE'] ?? 0;

				}
			}
		}
		return ['projects'=> $returnArray, 'taskStatus'=>$taskStatus] ;
	}

	public function getAllProjects() 
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$projectTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';

		// No user join here — we fetch ALL projects
		$sql = "SELECT id as projectId, name as projectName, company_id as companyId
				FROM {$projectTable}
				WHERE status = 1";

		$results = $db->get_results($sql, ARRAY_A);

		if (!$results) {
			return ['projects' => [], 'taskStatus' => []];
		}

		// Task counts
		$projectIds = array_column($results, 'projectId');
		$projectObj = new Lazytask_ProjectController();
		$totalTasks = $projectObj->getNoOfTasksByProject($projectIds, true);
		$taskStatus = isset($totalTasks['statusData']) ? $totalTasks['statusData'] : [];

		$returnArray = [];

		foreach ($results as $value) {
			$projectId = $value['projectId'];
			$companyId = $value['companyId'];

			// Get company name
			$companyName = '';
			if ($companyId) {
				$companyRow = $db->get_row(
					$db->prepare("SELECT name FROM {$companyTable} WHERE id = %d", $companyId),
					ARRAY_A
				);
				$companyName = $companyRow['name'] ?? '';
			}

			// Get project members
			$projectController = new Lazytask_ProjectController();
			$projectMembers = $projectController->getProjectMembers($projectId);
			$flatMembers = array_reduce($projectMembers, 'array_merge', []);

			$membersData = [];
			foreach ($flatMembers as $member) {
				$membersData[] = [
					'id' => $member['id'],
					'name' => $member['name'] ?? ($member['display_name'] ?? ''),
					'avatar' => Lazytask_UserController::getUserAvatar($member['id']),
				];
			}

			$returnArray['all'][$projectId] = [
				'id' => $projectId,
				'name' => $value['projectName'],
				'company_name' => $companyName,
				'members' => $membersData,
			];

			// Task counts
			if (!empty($taskStatus)) {
				$returnArray['all'][$projectId]['total_tasks'] =
					isset($totalTasks['recordData'][$projectId])
						? array_sum($totalTasks['recordData'][$projectId])
						: 0;

				foreach ($taskStatus as $status) {
					$returnArray['all'][$projectId][$status] =
						$totalTasks['recordData'][$projectId][$status] ?? 0;
				}

				$returnArray['all'][$projectId]['OVERDUE'] =
					$totalTasks['recordData'][$projectId]['OVERDUE'] ?? 0;
			}
		}

		return ['projects' => $returnArray, 'taskStatus' => $taskStatus];
	}

	public static function getUserAvatar($userId){
		$user = get_userdata( $userId );
		$profile_photo_id = get_user_meta($userId, 'profile_photo_id', true);
		if($profile_photo_id){
			$attachment = wp_get_attachment_image_src($profile_photo_id, 'thumbnail');
			if($attachment){
				return $attachment[0];
			}
		}

		/*if($user){
			return get_avatar_url($user->ID);
		}*/
		return '';

	}

	public function can_edit_delete_task($request) {
		// Get current user ID & Get task ID from request
		$current_user_id = get_current_user_id();
		$task_id = $request->get_param('id');
		if (!$current_user_id || !$task_id) {
			return false;
		}

		// Get task data
		$taskController = new Lazytask_TaskController();
		$task = $taskController->getTaskById($task_id);

		if ($task && isset($task->createdBy_id) && $task->createdBy_id == $current_user_id) {
			return true;
		}

		return false;
	}
	
	public function can_delete_comment($request) {
		// Get current user ID & Get task ID from request
		$current_user_id = get_current_user_id();
		$comment_id = $request->get_param('id');
		if (!$current_user_id || !$comment_id) {
			return false;
		}

		// Get task data
		$taskController = new Lazytask_TaskController();
		$comment = $taskController->getCommentsById($comment_id);

		if ($comment && isset($comment->user_id) && $comment->user_id == $current_user_id) {
			return true;
		}

		return false;
	}
	
	public function can_delete_attachment($request) {
		// Get current user ID & Get task ID from request
		$current_user_id = get_current_user_id();
		$attachment_id = $request->get_param('id');
		if (!$current_user_id || !$attachment_id) {
			return false;
		}

		// Get task data
		$taskController = new Lazytask_TaskController();
		$attachment = $taskController->getAttachmentById($attachment_id);

		if ($attachment && isset($attachment->user_id) && $attachment->user_id == $current_user_id) {
			return true;
		}

		return false;
	}
}