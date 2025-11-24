<?php

namespace Lazytask\Notification\includes;

use Lazytask\Controller\Lazytask_NotificationController;
use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use Lazytask\Notification\services\Firebase;
use Lazytask\Notification\services\SmsGateWay;

class Integrations {

	public function __construct() {
		add_action('phpmailer_init', [$this, 'configure_phpmailer'], 999);
		add_action('plugins_loaded', [$this, 'init']);

	}

	public function init() {
		global $wpdb;
		$db = (new \Lazytask\Helper\Lazytask_DatabaseTableSchema())->get_global_wpdb($wpdb);

		$notificationTemplateTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';

		$notificationTemplates = $db->get_results($db->prepare("SELECT * FROM {$notificationTemplateTable} where status=%d", 1), ARRAY_A);
		$notificationActionLists = array_unique(array_column($notificationTemplates, 'notification_action_name'));
		if($notificationActionLists) {
			foreach ($notificationActionLists as $action) {
				if($action){
					add_action($action, [$this, 'sendNotification'], 10, 4);
				}
			}
		}
	}

   	public function configure_phpmailer($phpmailer) {

	   $lazytaskSettings = get_option('lazytask_settings', []);
		$smtpConfig = isset($lazytaskSettings['smtp_configuration']) && $lazytaskSettings['smtp_configuration'] ? json_decode($lazytaskSettings['smtp_configuration'], true) : [];
		$smtpServiceProvider = isset($smtpConfig['smtp_service_provider']) && $smtpConfig['smtp_service_provider'] ? $smtpConfig['smtp_service_provider'] : '';
		$activeMailer        = isset($smtpConfig['active_mailer']) ? $smtpConfig['active_mailer'] : '';
		if($smtpServiceProvider && $smtpServiceProvider=='zoho') {
			$this->configure_zoho_phpmailer($phpmailer);
		}
	}

	public function configure_zoho_phpmailer($phpmailer) {
		$lazytaskSettings = get_option('lazytask_settings', []);
		$smtpConfig = isset($lazytaskSettings['smtp_configuration']) && $lazytaskSettings['smtp_configuration'] ? json_decode($lazytaskSettings['smtp_configuration'], true) : [];
		$smtpHost = isset($smtpConfig['smtp_host']) && $smtpConfig['smtp_host'] ? $smtpConfig['smtp_host'] : '';
		$smtpPort = isset($smtpConfig['smtp_port']) && $smtpConfig['smtp_port'] ? $smtpConfig['smtp_port'] : '';
		$smtpUsername = isset($smtpConfig['smtp_username']) && $smtpConfig['smtp_username'] ? $smtpConfig['smtp_username'] : '';
		$smtpPassword = isset($smtpConfig['smtp_password']) && $smtpConfig['smtp_password'] ? $smtpConfig['smtp_password'] : '';
		$smtpSenderName = isset($smtpConfig['smtp_sender_name']) && $smtpConfig['smtp_sender_name'] ? $smtpConfig['smtp_sender_name'] : '';
		$smtpSenderEmail = isset($smtpConfig['smtp_sender_email']) && $smtpConfig['smtp_sender_email'] ? $smtpConfig['smtp_sender_email'] : '';

		if( $smtpHost && $smtpPort && $smtpUsername && $smtpPassword && $smtpSenderName && $smtpSenderEmail) {
			$phpmailer->isSMTP();
			$phpmailer->Host       = $smtpHost;
			$phpmailer->SMTPAuth   = true;
			$phpmailer->Username   = $smtpUsername; // Replace with your Zoho email
			$phpmailer->Password   = $smtpPassword; // Replace with your Zoho email password
			$phpmailer->SMTPSecure = 'tls'; // Use 'tls' if you are using port 587
			$phpmailer->Port       = $smtpPort; // Use 587 for TLS
			$phpmailer->From       = $smtpSenderEmail; // Replace with your Zoho email
			$phpmailer->FromName   = $smtpSenderName; // Replace with your name or site name
			$phpmailer->isHTML( true ); // Set email format to HTML
			$phpmailer->CharSet = 'UTF-8'; // Set email character encoding
		}

	}

	public function sendNotification( $subjectInfo, $channels=[], $userIds=[], $placeholders = []) {

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationHistoriesTable = LAZYTASK_TABLE_PREFIX . "notification_histories";
		$notificationsTable = LAZYTASK_TABLE_PREFIX . "notifications";

		$registeredChannels = Lazytask_NotificationController::getChannels();

		$registeredChannelSlugs = array_column($registeredChannels, 'slug');

		$currentAction = current_filter();
		// get template by action
		$notificationTemplateTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		$notificationTemplate = $db->get_row($db->prepare("SELECT * FROM {$notificationTemplateTable} where notification_action_name=%s and status=%d", $currentAction, 1), ARRAY_A);

		$userInfo = [];

		if($notificationTemplate){
			// Decode channel_status
			$channelStatus = [];
			if (!empty($notificationTemplate['channel_status'])) {
				$channelStatus = is_array($notificationTemplate['channel_status'])
					? $notificationTemplate['channel_status']
					: json_decode($notificationTemplate['channel_status'], true);
			}
			if($channels && is_array($channels) && count($channels) > 0) {
				$templateContent = json_decode($notificationTemplate['content'], true);
				foreach ( $channels as $channel ) {
					if(in_array($channel, $registeredChannelSlugs) && !empty($channelStatus[$channel]) ) {
						$content = isset($templateContent[$channel]) && $templateContent[$channel]!='' ? $templateContent[$channel] : '';

						if($userIds && is_array($userIds) && count($userIds) > 0) {

							foreach ($userIds as $userId) {
							$insertedRecord =	$db->insert($notificationHistoriesTable, array(
									'notification_template_id' => $notificationTemplate['id'],
									'content' => $this->contentPlaceholderReplace($content, $placeholders),
									'notification_action_name' => $currentAction,
									'subject_id' => isset($subjectInfo['id']) && $subjectInfo['id'] ? $subjectInfo['id'] : null,
									'subject_type' => isset($subjectInfo['type']) && $subjectInfo['type'] ? $subjectInfo['type'] : null,
									'subject_name' => isset($subjectInfo['name']) && $subjectInfo['name'] ? $subjectInfo['name'] : null,
									'channel' => $channel,
									'user_id' => $userId,
									'status' => 1,
									'created_at' => current_time('mysql'),
								));
							if($insertedRecord){
								if($channel =='web-app'){
									$db->insert($notificationsTable, array(
										'notification_template_id' => $notificationTemplate['id'],
										'content' => $this->contentPlaceholderReplace($content, $placeholders),
										'notification_action_name' => $currentAction,
										'subject_id' => isset($subjectInfo['id']) && $subjectInfo['id'] ? $subjectInfo['id'] : null,
										'subject_type' => isset($subjectInfo['type']) && $subjectInfo['type'] ? $subjectInfo['type'] : null,
										'subject_name' => isset($subjectInfo['name']) && $subjectInfo['name'] ? $subjectInfo['name'] : null,
										'user_id' => $userId,
										'status' => 1,
										'created_at' => current_time('mysql'),
									));
								}

								// send notification
								$user = get_userdata($userId);
								$userInfo= [
									'id' => $user->ID,
									'email' => $user->user_email,
									'first_name' => $user->first_name,
									'last_name' => $user->last_name,
									'phone_number' => get_user_meta($user->ID, 'phone_number', true),
									];

								if($channel == 'email') {
									$to = $userInfo['email'];
									$subjectRaw = isset($notificationTemplate['email_subject']) && $notificationTemplate['email_subject'] ? $notificationTemplate['email_subject'] : 'Notification';
									$subject = $this->contentPlaceholderReplace($subjectRaw, $placeholders);
									$message = $this->contentPlaceholderReplace($content, $placeholders);
									$headers = array('Content-Type: text/html; charset=UTF-8');

									$lazytaskSettings = get_option('lazytask_settings', []);
									$smtpConfig = isset($lazytaskSettings['smtp_configuration']) && $lazytaskSettings['smtp_configuration'] ? json_decode($lazytaskSettings['smtp_configuration'], true) : [];
									$smtpServiceProvider = isset($smtpConfig['smtp_service_provider']) && $smtpConfig['smtp_service_provider'] ? $smtpConfig['smtp_service_provider'] : '';
									$is_smtp_enabled        = isset($smtpConfig['is_smtp_enabled']) ? $smtpConfig['is_smtp_enabled'] : '';
									if($smtpServiceProvider && $smtpServiceProvider=='zoho' && $is_smtp_enabled) {
										wp_mail($to, $subject, $message, $headers);
									}

								}elseif ($channel == 'sms') {
									// send sms
									$to = $userInfo['phone_number'];
									$message = $this->contentPlaceholderReplace($content, $placeholders);
									$from = 'PUL GROUP';
									$this->sendSMS($to, $message, $from);
								}elseif ($channel == 'mobile') {
									$title = isset($notificationTemplate['mobile_notification_title']) && $notificationTemplate['mobile_notification_title'] !='' ? $notificationTemplate['mobile_notification_title'] : 'Notification';
									$firebase = new Firebase();
									$to = get_user_meta($userId, 'lazytask_fcm_token', true);
									
									$lazytaskSettings = get_option('lazytask_settings', []);
									$firebaseConfig = isset($lazytaskSettings['firebase_configuration']) && $lazytaskSettings['firebase_configuration'] ? json_decode($lazytaskSettings['firebase_configuration'], true) : [];
									$is_firebase_enabled = isset($firebaseConfig['is_firebase_enabled']) ? $firebaseConfig['is_firebase_enabled'] : '';

									if($to && $to != '' && $content != '' && $firebaseConfig && !empty($firebaseConfig['firebase_client_email']) && !empty($firebaseConfig['firebase_private_key']) && $is_firebase_enabled ) {
										$message = [
											'title' => $this->contentPlaceholderReplace($title, $placeholders),
											'body' => $this->contentPlaceholderReplace($content, $placeholders),
										];
										$firebase->send($to, $message);
									}

								}

							}
							}

						}

					}

				}
			}

		}
		//insert notification

	}

	private function sendSMS($to, $message, $from) {
		// send sms
		// $smsGateWay = new SmsGateWay();
		// $smsGateWay->send($to, $message, $from);

		$lazytaskSettings = get_option('lazytask_settings', []);
		$smsConfig = isset($lazytaskSettings['sms_configuration']) && $lazytaskSettings['sms_configuration'] ? json_decode($lazytaskSettings['sms_configuration'], true) : [];
		$smsServiceProvider = isset($smsConfig['sms_service_provider']) && $smsConfig['sms_service_provider'] ? $smsConfig['sms_service_provider'] : '';
		$activeSmsGateway    = isset($smsConfig['active_sms_gateway']) ? $smsConfig['active_sms_gateway'] : '';
		$isSmsEnabled       = isset($smsConfig['is_sms_enabled']) ? $smsConfig['is_sms_enabled'] : '';

		$wp_sms = "wp-sms/wp-sms.php";
		if (is_plugin_active($wp_sms)){
			if (class_exists('\WP_SMS\BackgroundProcess\SmsDispatcher') && $isSmsEnabled){
				$is_flash = false;
				$mediaUrls = [];
				$smsDispatcher = new \WP_SMS\BackgroundProcess\SmsDispatcher($to, $message);
				return $smsDispatcher->dispatch();
			}
		}
		
	}
	
		
		

	public static function registeredActionLists() {
		$actionList = [
			'publish_post'=>'Publish Post',
			'user_register' => 'User Registration',
			'comment_post' => 'Wordpress Comment Post',
		];

		return apply_filters('lazycoder_integrated_action_list', $actionList);

	}

	private function contentPlaceholderReplace($string, $variables): string
	{
		if(empty($variables)){
			return nl2br($string);
		}
		$replacement = array_combine(
			array_map(function($k) { return '['.strtoupper($k).']'; }, array_keys($variables)),
			array_values($variables)
		);

		$returnString =  strtr($string, $replacement);

		return nl2br($returnString);
	}


}
new Integrations();

