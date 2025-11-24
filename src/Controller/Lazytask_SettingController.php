<?php

namespace Lazytask\Controller;

use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use Lazytask\Helper\Lazytask_SlugGenerator;
use Lazytask\Helper\Lazytask_Helper_QR_Code;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

final class Lazytask_SettingController {

	public function get_settings(WP_REST_Request $request)
	{
		$settings = get_option('lazytask_settings', []);
		//$currentTimezone = get_option('timezone_string', 'UTC');
		$timezone_string = get_option('timezone_string');
    	$gmt_offset = get_option('gmt_offset');
		$serialSettings = get_option('lazytask_serial_settings', []);
		$social_login_settings = get_option('lazytask_social_login_settings', []);

		if (empty($timezone_string)) {
			$offset = (float) $gmt_offset;
			$prefix = $offset >= 0 ? '+' : '';
			$currentTimezone = 'UTC' . $prefix . $offset;
		} else {
			$currentTimezone = $timezone_string;
		}

		$lazytask_page_id = get_option('lazytask_page_id');

		if (!$lazytask_page_id) {
			return new WP_REST_Response([
				'status' => 404,
				'message' => 'Portal page not found',
				'data' => null
			], 404);
		}

		$post = get_post($lazytask_page_id);

		if (!$post) {
			return new WP_REST_Response([
				'status' => 404,
				'message' => 'Portal page not found',
				'data' => null
			], 404);
		}

		$portal_data = [
			'id' => $post->ID,
			'title' => $post->post_title,
			'slug' => $post->post_name,
			'status' => $post->post_status,
			'permalink' => get_permalink($post->ID)
		];

		include_once(ABSPATH . 'wp-admin/includes/plugin.php');

		$addon_plugin_file = 'lazytasks-whiteboard/lazytasks-whiteboard.php';
		$installed_plugins = get_plugins();

		$is_installed = array_key_exists($addon_plugin_file, $installed_plugins);
		$is_active = is_plugin_active($addon_plugin_file);

		if (!$is_installed) {
			$whiteboard_addon_state = 'not_installed';
		} elseif ($is_installed && !$is_active) {
			$whiteboard_addon_state = 'installed_inactive';
		} elseif ($is_installed && $is_active) {
			$whiteboard_addon_state = 'installed_active';
		}

		$wp_sms = "wp-sms/wp-sms.php";
		if (is_plugin_active($wp_sms)) {
			$is_wpsms_active = true;
		} else {
			$is_wpsms_active = false;
		}

		$lazytasks_premium = "lazytasks-premium/lazytasks-premium.php";

		if ( !is_plugin_active( $lazytasks_premium ) || !class_exists( 'Lazytask_Lazytasks_Premium' ) ) {
		    $is_lazytasks_premium_active = false;
		}else{
			$is_lazytasks_premium_active = true;
		}
		
		return new WP_REST_Response([
			'status'=>200,
			'data'=>$settings,
			'is_wpsms_active'=>$is_wpsms_active,
			'is_lazytasks_premium_active' => $is_lazytasks_premium_active,
			'currentTimezone'=>$currentTimezone,
			'serialSettings'=>$serialSettings,
			'portalSettings'=>$portal_data,
			'social_login_settings'=>$social_login_settings,
			'whiteboard_addon_state' => $whiteboard_addon_state,
		], 200);
	}

	public function update_settings(WP_REST_Request $request)
	{


		$requestData = $request->get_body_params();
		$settings = isset($requestData['settings']) ? json_decode($requestData['settings'], true) : [];

		if (!is_array($settings)) {
			return new WP_Error('invalid_settings', $settings, ['status' => 400]);
		}
		$oldSettings = get_option('lazytask_settings', []);
		$oldCoreSettings = json_decode($oldSettings['core_setting'], true);
		if(isset($settings['type']) && $settings['type'] !=''){

			if( $settings['type'] =='general') {
				//wp_handle_upload site_logo

				$requestFile = $request->get_file_params();


				if( isset($requestFile['site_logo']) && $requestFile['site_logo'] !=''){
					require_once(ABSPATH . 'wp-admin/includes/file.php');
					$uploadedfile = $requestFile['site_logo'];
					$upload_overrides = array( 'test_form' => false );
					$movefile = wp_handle_upload( $uploadedfile, $upload_overrides );
					if ( $movefile && !isset( $movefile['error'] ) ) {
						$settings['core_setting']['site_logo'] = $movefile['url'];
					} else {
						$settings['core_setting']['site_logo'] = isset($oldCoreSettings['site_logo']) ? $oldCoreSettings['site_logo'] : '';
					}
				}else{
					$settings['core_setting']['site_logo'] = isset($oldCoreSettings['site_logo']) ? $oldCoreSettings['site_logo'] : '';
				}

				$timezone = isset($requestData['timezone']) ? sanitize_text_field($requestData['timezone']) : '';

				if (!empty($timezone)) {
					// update_option('timezone_string', $timezone);
					if (preg_match('/^UTC([+-])(\d+(\.\d+)?)$/', $timezone, $matches)) {
						$sign = $matches[1] === '+' ? 1 : -1;
						$offset = floatval($matches[2]) * $sign;

						// Update gmt_offset and clear timezone_string
						update_option('gmt_offset', $offset);
						update_option('timezone_string', '');
					} else {
						// Update timezone_string and clear gmt_offset 
						update_option('timezone_string', $timezone);
						update_option('gmt_offset', '');
					}
				}

				// Handle serial number settings
				$isSerialEnabled = isset($requestData['is_serial_enabled']) ? 
					filter_var($requestData['is_serial_enabled'], FILTER_VALIDATE_BOOLEAN) : null;
				$serialNumber = isset($requestData['serial_number']) ? 
					sanitize_text_field($requestData['serial_number']) : null;

				if ($isSerialEnabled !== null && $serialNumber !== null) {
					$serialSettings = get_option('lazytask_serial_settings', false);
					if($serialSettings){
						update_option('lazytask_serial_settings', [
							'enabled' => $isSerialEnabled,
							'number' => $serialNumber
						]);
					}else{
						global $wpdb;
						$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';
						
						// Get all tasks with null serial_no ordered by ID
						$tasks = $wpdb->get_results(
							"SELECT id FROM {$table_name} 
							WHERE deleted_at IS NULL
							ORDER BY id ASC"
						);
					
						if (!empty($tasks)) {
							$ids = [];
							$case_sql = '';
							$serial = (int) $serialNumber;

							foreach ($tasks as $task) {
								$id = (int) $task->id;
								$ids[] = $id;
								$case_sql .= "WHEN id = $id THEN $serial ";
								$serial++;
							}

							if($ids && count($ids) > 0){
								$ids_list = implode(',', $ids);
								$sql = "
									UPDATE $table_name
									SET serial_no = CASE 
										$case_sql
										ELSE serial_no
									END
									WHERE id IN ($ids_list)
								";
		
								$result = $wpdb->query($sql);
							}

						}

						add_option('lazytask_serial_settings', [
							'enabled' => $isSerialEnabled,
							'number' => $serialNumber
						]);
					}
				}

				$settings['core_setting'] = json_encode($settings['core_setting']);
			}elseif( $settings['type'] =='notification' ) {
				$settings['notification_setting'] = json_encode($settings['notification_setting']);
			}elseif($settings['type'] =='smtp') {
				$settings['smtp_configuration'] = json_encode($settings['smtp_configuration']);
			}elseif($settings['type'] =='sms' ) {
				$settings['sms_configuration'] = json_encode($settings['sms_configuration']);
			}elseif($settings['type'] =='firebase' ) {
				// $settings['firebase_configuration'] = json_encode($settings['firebase_configuration']);
				$firebase_config = isset($oldSettings['firebase_configuration']) ? json_decode($oldSettings['firebase_configuration'], true) : [];
    			$firebase_config['is_firebase_enabled']  = $settings['firebase_configuration']['is_firebase_enabled'];
				$firebase_config['firebase_client_email'] = $settings['firebase_configuration']['firebase_client_email'];
    			$firebase_config['firebase_private_key']  = $settings['firebase_configuration']['firebase_private_key'];
				$settings['firebase_configuration'] = json_encode($firebase_config);
			}else{
				// If type not firebase, keep old firebase settings from database not request
				$firebase_config = isset($oldSettings['firebase_configuration']) ? json_decode($oldSettings['firebase_configuration'], true) : [];
				$settings['firebase_configuration'] = json_encode($firebase_config);
			}
		}


		update_option('lazytask_settings', $settings);
		Lazytask_Helper_QR_Code::lazytask_preview_app_qrcode_generator();


		$getSettings = get_option('lazytask_settings', []);
		$current_timezone = get_option('timezone_string', 'UTC');
		$getSerialSettings = get_option('lazytask_serial_settings', []);


		return new WP_REST_Response([
			'status'=>200,
			'message'=>'Settings update successfully',
			'data'=>$getSettings,
			'requestData'=>$settings,
			'currentTimezone'=>$current_timezone,
			'serialSettings'=>$getSerialSettings,
		], 200);
	}

	public function getLazytaskConfig()
	{

		$getLazytasksConfig = get_option('lazytasks_config');
		$lazytask_do_activation_redirect = get_option('lazytask_do_activation_redirect');

		$data = json_decode($getLazytasksConfig, true);
		$lazytask_license_key = get_option('lazytask_license_key');
		if($lazytask_license_key){
			$data['lazytask_license_key'] = $lazytask_license_key;
		}else{
			$data['lazytask_license_key'] = '';
		}
		$qrCodeImage = get_option('lazytask_free_qr_code', '');
		if($qrCodeImage) {
			$data['qrCode'] = $qrCodeImage;
		}else{
			$data['qrCode'] = '';
		}
		$data['lazytask_do_activation_redirect'] = $lazytask_do_activation_redirect;
		$settings = get_option('lazytask_settings', []);
		$social_login_settings = get_option('lazytask_social_login_settings', []);

		return new WP_REST_Response(
			[
				'status' => 200,
				'message' => 'Lazytask Config',
				'data' => $data,
				'settings' => $settings,
				'social_login_settings' => $social_login_settings
			]

		);
	}

	public function updateLazytaskConfig( WP_REST_Request $request )
	{

		$requestData = $request->get_json_params();

		$option_value = get_option('lazytasks_config', []);
		$data = json_decode($option_value, true);

		if (isset($requestData['step_completed'])) {
			$data['step_completed'] = $requestData['step_completed'];
		}

		if (isset($requestData['lazytasks_basic_info_guide_modal'])) {
			$data['lazytasks_basic_info_guide_modal'] = $requestData['lazytasks_basic_info_guide_modal'];
		}

		if (isset($requestData['lazytask_do_activation_redirect'])) {
			update_option('lazytask_do_activation_redirect', $requestData['lazytask_do_activation_redirect']);
		}

		update_option('lazytasks_config', json_encode($data));

		$getLazytasksConfig = get_option('lazytasks_config');
		$afterUpdateData = json_decode($getLazytasksConfig, true);
		$afterUpdateData['lazytask_do_activation_redirect'] = get_option('lazytask_do_activation_redirect');

		return new WP_REST_Response(
			[
				'status' => 200,
				'message' => 'Lazytask Config',
				'data' => $afterUpdateData,
				'requestData' => $requestData
			]

		);
	}

	// check qr code value site url
	public function domainValidationCheck(WP_REST_Request $request) {

		$requestData = sanitize_text_field($request->get_param('domain'));
		$requestData = str_replace(['http://', 'https://', 'www.'], '', $requestData);

		$siteUrl = get_site_url();
		$siteUrl = str_replace(['http://', 'https://', 'www.'], '', $siteUrl);

		$lazytasks_premium = "lazytasks-premium/lazytasks-premium.php";

		if ( !is_plugin_active( $lazytasks_premium ) || !class_exists( 'Lazytask_Lazytasks_Premium' ) ) {
		    return new WP_REST_Response([
		        'status' => 403,
		        'data' => false,
		        'message' => 'Please activate Lazytasks Premium plugin to use this feature.'
		    ], 403);
		}

		if($requestData && $requestData == $siteUrl) {
			return new WP_REST_Response( [
				'status' => 200,
				'data' => true,
				'message' => 'Domain is valid',
			], 200 );
		}
		return new WP_REST_Response( [
			'status' => 404,
			'data' => false,
			'message' => 'Domain is not valid',
		], 404 );
	}
	
	
	public function getTimezoneOptions(WP_REST_Request $request) {

		// $timezones = timezone_identifiers_list();
		//array push UTC+0
		// $timezones = array_merge( $timezones, ['UTC+0'] );

		$selected_zone = '';
		$timezone_options_html = wp_timezone_choice($selected_zone);
		$options = [];
		if($timezone_options_html) {
			preg_match_all('/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/', $timezone_options_html, $matches);
			
			if(!empty($matches[1]) && !empty($matches[2])) {
				foreach($matches[1] as $key => $value) {
					if(!empty($value)) {
						$options[] = [
							'value' => $value,
							'label' => trim($matches[2][$key])
						];
					}
				}
			}
		}

		if(!empty($options)) {
			return new WP_REST_Response( [ 'status' => 200, 'data' => $options ], 200 );
		}
		return new WP_REST_Response( [ 'status' => 404, 'data' => false ], 404 );
	}

	public function update_portal_settings(WP_REST_Request $request) 
	{
		$data = $request->get_json_params();
		
		$lazytask_page_id = get_option('lazytask_page_id');

		if (!$lazytask_page_id) {
			return new WP_Error('portal_not_found', 'Portal page not found', ['status' => 404]);
		}

		// Get portal status with proper boolean handling
		$is_portal_enable = isset($data['is_portal_enable']) ? 
			(bool)$data['is_portal_enable'] : false;
		
		// Get and sanitize portal slug
		$portal_slug = isset($data['portal_slug']) ? 
			sanitize_title($data['portal_slug']) : 'lazytasks';
		
		// post status update
		$post_data = array(
			'ID' => $lazytask_page_id,
			'post_name' => $portal_slug,
			'post_status' => $is_portal_enable ? 'publish' : 'draft'
		);
		
		// Update post status and slug
		$updated_post = wp_update_post($post_data, true);

		if (is_wp_error($updated_post)) {
			error_log('Post Update Error: ' . $updated_post->get_error_message());
			return new WP_Error('update_failed', $updated_post->get_error_message(), ['status' => 500]);
		}

		// Clear post cache and get fresh data
		clean_post_cache($lazytask_page_id);
		$post = get_post($lazytask_page_id);
		
		$portal_data = [
			'id' => $post->ID,
			'title' => $post->post_title,
			'slug' => $post->post_name,
			'status' => $post->post_status,
			'permalink' => get_permalink($post->ID)
		];

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Portal settings updated successfully',
			'data' => $portal_data
		], 200);
	}
	
	public function sendFeedback(WP_REST_Request $request) {
		$params = $request->get_json_params();
		$name    = sanitize_text_field($params['name'] ?? '');
		$email   = sanitize_email($params['email'] ?? '');
		$message = sanitize_textarea_field($params['message'] ?? '');

		if (empty($name) || empty($email) || empty($message)) {
			return new WP_REST_Response(['error' => 'All fields are required'], 400);
		}

		$to = 'support@lazycoders.co';
		$subject = "New Feedback from {$name}";
		// $body = "Name: {$name}\nEmail: {$email}\n\nMessage:\n{$message}";
		$body = '
			<html>
			<head>
				<title>New Feedback</title>
			</head>
			<body>
				<h2>New Feedback Submission</h2>
				<p><strong>Name:</strong> ' . esc_html($name) . '</p>
				<p><strong>Email:</strong> ' . esc_html($email) . '</p>
				<p><strong>Message:</strong></p>
				<p>' . nl2br(esc_html($message)) . '</p>
			</body>
			</html>
		';
		$headers = [
			'Content-Type: text/html; charset=UTF-8',
			'From: Lazy Coders <support@lazycoders.co>',
			'Reply-To: ' . $email,
		];

		$mail_sent = wp_mail($to, $subject, $body, $headers);

		if ($mail_sent) {
			return new WP_REST_Response(['status' => 200, 'message' => 'Feedback sent successfully'], 200);
		} else {
			return new WP_REST_Response(['message' => 'Email sending failed'], 500);
		}
	}

	public function editLicenseModalStatus(WP_REST_Request $request)
	{
		$user_id = $request->get_param('user_id');
		if (!$user_id) {
			return new WP_Error('invalid_user', 'User ID is required', ['status' => 400]);
		}

		$today = current_time('Y-m-d');

		$shown_date = get_user_meta($user_id, 'lazytask_license_warning_modal_shown', true);

		if ($shown_date === $today) {
			return new WP_REST_Response(['already_shown' => true], 200);
		}

		update_user_meta($user_id, 'lazytask_license_warning_modal_shown', $today);
		return new WP_REST_Response(['already_shown' => false], 200);
	}

	public function installActivateAddon(WP_REST_Request $request)
	{	
		$requestData = $request->get_json_params();
		$addon = isset($requestData['addon']) ? sanitize_text_field($requestData['addon']) : '';
		
		if (empty($addon) || $addon !== 'lazytasks-whiteboard') {
			return new WP_Error('invalid_addon', 'Invalid addon specified', ['status' => 400]);
		}

		$addon_plugin_file = 'lazytasks-whiteboard/lazytasks-whiteboard.php';
		$plugin_abs_path = WP_PLUGIN_DIR . '/lazytasks-whiteboard/lazytasks-whiteboard.php';

		// If plugin file exists, just activate if not active
		if (file_exists($plugin_abs_path)) {
			if (is_plugin_active($addon_plugin_file)) {
				return new WP_REST_Response([
					'status' => 200,
					'message' => 'Whiteboard plugin is already installed and active'
				], 200);
			} else {
				$activate = activate_plugin($addon_plugin_file);
				$whiteboard_addon_state = 'installed_active';
				if (is_wp_error($activate)) {
					return new WP_REST_Response([
						'status' => 500,
						'message' => 'Addon activation failed: ' . $activate->get_error_message()
					], 500);
				}
				return new WP_REST_Response([
					'status' => 200,
					'message' => 'Whiteboard plugin activated successfully',
					'whiteboard_addon_state' => $whiteboard_addon_state
				], 200);
			}
		}

		$api_url = add_query_arg(
			[
				'plugin_slug' => 'lazytasks-whiteboard'
			],
			LAZYTASK_APP_BUILDER_RESOURCE_URL . "/api/appza/v1/plugin/install-latest-version"
		);

		$response = wp_remote_get(
			$api_url,
			[
				'headers' => [
					'Accept' => 'application/json',
					'Content-Type' => 'application/json',
				]
			]
		);

		if (is_wp_error($response)) {
			return new WP_REST_Response([
				'status'  => 500,
				'message' => 'Failed to connect: ' . $response->get_error_message()
			], 500);
		}

		$data = json_decode(wp_remote_retrieve_body($response), true);

		if (empty($data['download_url'])) {
			return new WP_REST_Response([
				'status'  => 500,
				'message' => 'Addon download URL not found'
			], 500);
		}

		// Download URL
		$addon_zip_url = esc_url_raw($data['download_url']);
		error_log('Addon Zip URL: ' . $addon_zip_url); // --- IGNORE ---

		// Load required WordPress classes
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/misc.php';
		require_once ABSPATH . 'wp-admin/includes/template.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-ajax-upgrader-skin.php';

		// Download & install the addon
		$skin = new \WP_Ajax_Upgrader_Skin();
		$upgrader = new \Plugin_Upgrader($skin);
		$result = $upgrader->install($addon_zip_url);

		if (is_wp_error($result)) {
			return new WP_REST_Response([
				'status' => 500,
				'message' => 'Addon installation failed: ' . $result->get_error_message()
			], 500);
		}		

		// Activate the addon
		$activate = activate_plugin($addon_plugin_file);
		$whiteboard_addon_state = 'installed_active';

		if (is_wp_error($activate)) {
			return new WP_REST_Response([
				'status' => 500,
				'message' => 'Addon installed but activation failed: ' . $activate->get_error_message()
			], 500);
		}

		// Redirect back with success notice
		return new WP_REST_Response([
			'status' => 200, 'message' => 'Whiteboard plugin installed and activated successfully',
			'whiteboard_addon_state' => $whiteboard_addon_state
		], 200);
	}

	public function toggleAddonStatus(WP_REST_Request $request)
	{
		$requestData = $request->get_json_params();
		$addon = isset($requestData['addon']) ? sanitize_text_field($requestData['addon']) : '';
		
		if (empty($addon) || $addon !== 'lazytasks-whiteboard') {
			return new WP_Error('invalid_addon', 'Invalid addon specified', ['status' => 400]);
		}
		
		// Plugin file path
		$addon_plugin_file = 'lazytasks-whiteboard/lazytasks-whiteboard.php';
		$plugin_abs_path = WP_PLUGIN_DIR . '/lazytasks-whiteboard/lazytasks-whiteboard.php';

		if (!file_exists($plugin_abs_path)) {
			return new WP_REST_Response([
				'status' => 404,
				'message' => 'Addon not installed'
			], 404);
		}

		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		if (is_plugin_active($addon_plugin_file)) {
			// Deactivate
			deactivate_plugins($addon_plugin_file);
			$whiteboard_addon_state = 'installed_inactive';
			return new WP_REST_Response([
				'status' => 200,
				'message' => 'Addon deactivated successfully',
				'active' => false,
				'whiteboard_addon_state' => $whiteboard_addon_state
			], 200);
		} else {
			// Activate
			$activate = activate_plugin($addon_plugin_file);
			$whiteboard_addon_state = 'installed_active';
			if (is_wp_error($activate)) {
				return new WP_REST_Response([
					'status' => 500,
					'message' => 'Addon activation failed: ' . $activate->get_error_message(),
					'active' => false,
					'whiteboard_addon_state' => $whiteboard_addon_state
				], 500);
			}
			return new WP_REST_Response([
				'status' => 200,
				'message' => 'Addon activated successfully',
				'active' => true
			], 200);
		}
	}

	public function updateSocialLoginSettings(WP_REST_Request $request)
	{
		$requestData = $request->get_json_params();
		$social_login_settings = isset($requestData['social_login_settings']) ? 
			(array)$requestData['social_login_settings'] : [];

		if (empty($social_login_settings)) {
			return new WP_Error('invalid_settings', 'Social login settings are required', ['status' => 400]);
		}

		$existing_settings = get_option('lazytask_social_login_settings', []);
		$updated_settings = array_merge($existing_settings, $social_login_settings);

		update_option('lazytask_social_login_settings', $updated_settings);

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Social login settings updated successfully',
			'data' => $updated_settings
		], 200);
	}

	// Function to translate strings
	public function translate_strings(WP_REST_Request $request)
	{
		$strings = \Lazytask\Services\TransStrings::getStrings();

		// Generate a checksum to detect changes
		$hash = md5(json_encode($strings));

		return new WP_REST_Response([
			'status' => 200,
			'hash' => $hash,
			'strings' => $strings,
		], 200);
	}

}