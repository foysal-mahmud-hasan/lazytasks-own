<?php

namespace Lazytask\Controller;

use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use Lazytask\Notification\includes\Integrations;
use WP_REST_Request;
use WP_REST_Response;

final class Lazytask_NotificationController {

	//$actionList
	protected array $actionList = [];

	public function __construct() {
		$this->init();
		$this->actionList = [
			'lazy_coder_task_created'=>'Task Create',
			'lazy_coder_task_updated'=>'Task Update',
			'lazy_coder_task_assigned' => 'Task Assigned'
		];
	}

	private function init() {
		add_filter('lazycoder_integrated_action_list', [$this, 'extendedNotificationAction']);
	}
    public function extendedNotificationAction($preDefineActionList) {
		$actionList = $this->actionList;
		return array_merge($preDefineActionList, $actionList);
	}


	public function getNotificationActionList() {

		$actionList = Integrations::registeredActionLists();

		return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$actionList], 200);
	}


	public function getNotificationChannels() {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationChannelTable = LAZYTASK_TABLE_PREFIX . 'notification_channels';
		$notificationChannels = self::getChannels();
		try {
			if($notificationChannels) {
				return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$notificationChannels], 200);
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'No channel found', 'data'=>[]], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}
	}

	public static function getChannels() {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationChannelTable = LAZYTASK_TABLE_PREFIX . 'notification_channels';
		$notificationChannels = $db->get_results($db->prepare("SELECT * FROM {$notificationChannelTable} where status=%d ORDER BY `sort_order` ASC", 1), ARRAY_A);

		return $notificationChannels;
	}

	public function getNotificationTemplates() {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationTemplateTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		$notificationTemplates = $db->get_results($db->prepare("SELECT * FROM {$notificationTemplateTable} where status=%d", 1), ARRAY_A);
		try {
			$returnData = [];
			if($notificationTemplates) {
				foreach ($notificationTemplates as $notificationTemplate) {
					$notificationTemplate['content'] = json_decode($notificationTemplate['content']);
					$returnData[] = $notificationTemplate;
				}
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'No template found', 'data'=>$returnData], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}

	}

	// create notification template
	public function createNotificationTemplate(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationTemplateTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		$data = $request->get_json_params();

		try {
			$notificationTemplateData = [
				'title' => isset($data['title']) && $data['title'] ? sanitize_text_field($data['title']) : null,
				'description' => isset($data['description']) && $data['description'] ? sanitize_textarea_field($data['description']) : null,
				'channel_status' => isset($data['channel_status']) && $data['channel_status'] ? wp_json_encode($data['channel_status']) : null,
				'content' => isset($data['content']) && $data['content'] ? wp_json_encode($data['content']) : null,
				'notification_action_name' => isset($data['notification_action_name']) && $data['notification_action_name'] ? $data['notification_action_name'] : null,
				'email_subject' => isset($data['email_subject']) && $data['email_subject'] ? $data['email_subject'] : null,
				'status' => 1,
				'created_at' => current_time('mysql'),
				'updated_at' => current_time('mysql'),
				'mobile_notification_title' => isset($data['mobile_notification_title']) && $data['mobile_notification_title']!='' ? sanitize_text_field($data['mobile_notification_title']) : null,
			];
			$notificationTemplateInsert = $db->insert($notificationTemplateTable, $notificationTemplateData);
			if($notificationTemplateInsert) {
				$notificationTemplateId = $wpdb->insert_id;
				$notificationTemplate = $this->getNotificationTemplateById($notificationTemplateId);
				return new WP_REST_Response(['status'=>200, 'message'=>'Notification template created successfully', 'data'=>$notificationTemplate], 200);
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Notification template not created', 'data'=>[]], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}
	}

	//show notification template by id
	public function showNotificationTemplate(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationTemplateTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		$templateId = $request->get_param('id');
		$notificationTemplate = $this->getNotificationTemplateById($templateId);
		try {
			if($notificationTemplate) {
				return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$notificationTemplate], 200);
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'No template found', 'data'=>[]], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}
	}

	// get notification template by id
	public function getNotificationTemplateById($templateId) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationTemplateTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		$notificationTemplate = $db->get_row($db->prepare("SELECT * FROM {$notificationTemplateTable} where id=%d", $templateId), ARRAY_A);
		try {
			if($notificationTemplate) {
				$notificationTemplate['content'] = json_decode($notificationTemplate['content']);
				return $notificationTemplate;
			}
			return null;
		} catch (\Exception $e) {
			return null;
		}
	}

	//editNotificationTemplate
	public function editNotificationTemplate(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationTemplateTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		$templateId = $request->get_param('id');
		$data = $request->get_json_params();
		$notificationTemplate = $this->getNotificationTemplateById($templateId);
		if(!$notificationTemplate) {
			return new WP_REST_Response(['status'=>200, 'message'=>'No template found', 'data'=>[]], 200);
		}
		try {
			$notificationTemplateData = [
				'title' => isset($data['title']) && $data['title'] ? sanitize_text_field($data['title']) : $notificationTemplate['title'],
				'description' => isset($data['description']) && $data['description'] ? sanitize_textarea_field($data['description']) : $notificationTemplate['description'],
				'channel_status' => isset($data['channel_status']) && $data['channel_status'] ? wp_json_encode($data['channel_status']) : null,
				'content' => isset($data['content']) && $data['content'] ? wp_json_encode($data['content']) : null,
				'notification_action_name' => isset($data['notification_action_name']) && $data['notification_action_name'] ? $data['notification_action_name'] : null,
				'email_subject' => isset($data['email_subject']) && $data['email_subject'] ? $data['email_subject'] : null,
				'updated_at' => current_time('mysql'),
				'mobile_notification_title' => isset($data['mobile_notification_title']) && $data['mobile_notification_title']!='' ? sanitize_text_field($data['mobile_notification_title']) : null,
			];
			$notificationTemplateUpdate = $db->update($notificationTemplateTable, $notificationTemplateData, ['id'=>$templateId]);
			if($notificationTemplateUpdate) {
				$notificationTemplate = $this->getNotificationTemplateById($templateId);
				return new WP_REST_Response(['status'=>200, 'message'=>'Notification template updated successfully', 'data'=>$notificationTemplate], 200);
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Notification template not updated', 'data'=>[]], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}
	}

	//delete notification template by id
	public function deleteNotificationTemplate(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationTemplateTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		$templateId = $request->get_param('id');
		$notificationTemplate = $this->getNotificationTemplateById($templateId);
		if(!$notificationTemplate) {
			return new WP_REST_Response(['status'=>200, 'message'=>'No template found', 'data'=>[]], 200);
		}
		try {
			// delete notification template
			$notificationTemplateDelete = $db->delete($notificationTemplateTable, ['id'=>$templateId]);
			if($notificationTemplateDelete) {
				return new WP_REST_Response(['status'=>200, 'message'=>'Notification template deleted successfully', 'data'=>['id'=>$templateId]], 200);
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Notification template not deleted', 'data'=>[]], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}
	}

	//get notification history by user id and array channels read or unread
	public function getNotificationHistoryByUserId(WP_REST_Request $request) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationHistoriesTable = LAZYTASK_TABLE_PREFIX . 'notification_histories';
		$notificationTemplatesTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		// get request header
		$token = $request->get_header('Authorization');
		$token = str_replace('Bearer ', '', $token);
		$token = str_replace('bearer ', '', $token);
		$token = str_replace('Token ', '', $token);
		$token = str_replace('token ', '', $token);

		$userController = new Lazytask_UserController();
		$decodedToken = $userController->decode($token);
		if($decodedToken && isset($decodedToken['status']) && $decodedToken['status'] == 403 && isset($decodedToken['message']) && $decodedToken['message'] == 'Expired token'){
			return new WP_REST_Response(['code'=> 'jwt_auth_invalid_token', 'status'=>403, 'message'=>$decodedToken['message'], 'data'=>$decodedToken], 403);
		}

		$userId = $decodedToken['data']['user_id'];
		$auto_logout = $request->get_param('auto_logout');

		$user_version = get_user_meta($userId, '_lazytask_force_logout_version', true);
		if (1 != $user_version && $auto_logout) {
			
			add_user_meta($userId, '_lazytask_force_logout_version', 1);
			return new WP_REST_Response(['status'=>403, 'message'=>'You have been logged out due to a security update. Please log in again.']);
			
		}

		// $userId = $request->get_param('user_id');
		$channels = $request->get_param('channels');
		//$channels array check
		if(is_array($channels) && count($channels) > 0) {
			$channels = array_map('sanitize_text_field', $channels);
		} else {
			$channels = [$channels];
		}
		$notificationHistories = $db->get_results($db->prepare("SELECT nh.*, nt.title, nt.description, nt.email_subject, nt.mobile_notification_title FROM {$notificationHistoriesTable} nh LEFT JOIN {$notificationTemplatesTable} nt ON nh.notification_template_id=nt.id WHERE nh.user_id=%d AND nh.channel IN ('".implode("','", $channels)."') ORDER BY nh.created_at DESC LIMIT 30", $userId), ARRAY_A);
		try {
			if($notificationHistories) {
				return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$notificationHistories], 200);
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'No notification history found', 'data'=>[]], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}
	}

	public function changeNotificationStatus(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationHistoriesTable = LAZYTASK_TABLE_PREFIX . 'notification_histories';
		$notificationTemplatesTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		
		// Get parameters
		$userId = $request->get_param('user_id');
		$channels = $request->get_param('channels');
		$id = $request->get_param('id');
		
		// Validate parameters
		if (!$id || !$userId || !$channels) {
			return new WP_REST_Response([
				'status' => 400, 
				'message' => 'Missing required parameters'
			], 400);
		}

		try {
			
			$notification_query = $db->get_row(
				$db->prepare(
					"SELECT id, user_id, is_read FROM {$notificationHistoriesTable} 
					WHERE id = %d AND user_id = %d",
					$id,
					$userId
				)
			);

			if (!$notification_query) {
				return new WP_REST_Response([
					'status' => 404,
					'message' => 'Notification not found'
				], 404);
			}

			// Update notification status
			$updated = $db->update(
				$notificationHistoriesTable,
				array(
					'is_read' => '1',
					'updated_at' => current_time('mysql'),
				),
				array('id' => $id)
			);

			if ($updated === false) {
				throw new \Exception('Failed to update notification status');
			}

			// Get updated notifications list
			$notificationHistories = $db->get_results(
				$db->prepare(
					"SELECT nh.*, nt.title, nt.description, nt.email_subject, nt.mobile_notification_title 
					FROM {$notificationHistoriesTable} nh 
					LEFT JOIN {$notificationTemplatesTable} nt ON nh.notification_template_id = nt.id 
					WHERE nh.user_id = %d AND nh.channel IN ('".implode("','", (array)$channels)."') 
					ORDER BY nh.created_at DESC LIMIT 30",
					$userId
				),
				ARRAY_A
			);

			return new WP_REST_Response([
				'status' => 200,
				'message' => 'Notification status updated successfully',
				'data' => $notificationHistories ?: []
			], 200);

		} catch (\Exception $e) {
			return new WP_REST_Response([
				'status' => 500,
				'message' => 'Error updating notification status',
				'error' => $e->getMessage()
			], 500);
		}
	}

	public function markAllNotificationsAsRead(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$notificationHistoriesTable = LAZYTASK_TABLE_PREFIX . 'notification_histories';
		$notificationTemplatesTable = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		
		// Get parameters
		$userId = $request->get_param('user_id');
		$channels = $request->get_param('channels');
		$notification_ids = $request->get_param('notification_ids');
		
		// Validate parameters
		if (!$notification_ids || !$userId || !$channels) {
			return new WP_REST_Response([
				'status' => 400, 
				'message' => 'Missing required parameters'
			], 400);
		}

		try {
			
			if ($notification_ids && is_array($notification_ids)) {
				// Prepare placeholders for SQL IN clause
				$placeholders = array_fill(0, count($notification_ids), '%d');
				$placeholders_string = implode(',', $placeholders);
				
				// Verify notifications belong to the user
				$notifications_query = $db->get_results(
					$db->prepare(
						"SELECT id FROM {$notificationHistoriesTable} 
						WHERE id IN ($placeholders_string) AND user_id = %d",
						...array_merge($notification_ids, [$userId])
					)
				);

				if (count($notifications_query) !== count($notification_ids)) {
					return new WP_REST_Response([
						'status' => 404,
						'message' => 'Some notifications not found or do not belong to the user'
					], 404);
				}

				// Bulk update notifications
				$updated = $db->query(
					$db->prepare(
						"UPDATE {$notificationHistoriesTable} 
						SET is_read = '1', updated_at = %s 
						WHERE id IN ($placeholders_string) AND user_id = %d",
						current_time('mysql'),
						...array_merge($notification_ids, [$userId])
					)
				);
			}

			if ($updated === false) {
				throw new \Exception('Failed to update notification status');
			}

			// Get updated notifications list
			$notificationHistories = $db->get_results(
				$db->prepare(
					"SELECT nh.*, nt.title, nt.description, nt.email_subject, nt.mobile_notification_title 
					FROM {$notificationHistoriesTable} nh 
					LEFT JOIN {$notificationTemplatesTable} nt ON nh.notification_template_id = nt.id 
					WHERE nh.user_id = %d AND nh.channel IN ('".implode("','", (array)$channels)."') 
					ORDER BY nh.created_at DESC LIMIT 30",
					$userId
				),
				ARRAY_A
			);

			return new WP_REST_Response([
				'status' => 200,
				'message' => 'Notification status updated successfully',
				'data' => $notificationHistories ?: []
			], 200);

		} catch (\Exception $e) {
			return new WP_REST_Response([
				'status' => 500,
				'message' => 'Error updating notification status',
				'error' => $e->getMessage()
			], 500);
		}
	}

}