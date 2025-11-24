<?php

namespace Lazytask\Controller;

use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use Lazytask\Helper\Lazytask_SlugGenerator;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

final class Lazytask_TaskController {


	const TABLE_TASKS = LAZYTASK_TABLE_PREFIX . 'tasks';
	const TABLE_TASK_MEMBERS = LAZYTASK_TABLE_PREFIX . 'task_members';
	const TABLE_COMMENTS = LAZYTASK_TABLE_PREFIX . 'comments';

	const TABLE_ACTIVITY_LOG = LAZYTASK_TABLE_PREFIX . 'activity_log';

	const TABLE_ATTACHMENTS = LAZYTASK_TABLE_PREFIX . 'attachments';

	public function create(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		// Sanitize and validate the input data
		$requestData = $request->get_json_params();
		$name = sanitize_text_field($requestData['name']);
		$slug = Lazytask_SlugGenerator::slug($name, self::TABLE_TASKS, 'slug');
		$parent = isset($requestData['parent']) && $requestData['parent'] != "" ? (int)$requestData['parent']['id'] : null;
		$projectId = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;
		$taskSectionId = isset($requestData['task_section_id']) && $requestData['task_section_id'] != "" ? (int)$requestData['task_section_id'] : null;
		$priorityId = isset($requestData['priority']) && $requestData['priority'] != "" ? (int)$requestData['priority']['id'] : null;
		$priority = isset($requestData['priority']) && $requestData['priority'] != "" ? $requestData['priority'] : null;
		$internal_status_id = isset($requestData['internal_status']) && $requestData['internal_status'] != "" ? (int)$requestData['internal_status']['id'] : null;
		$assignedToId = isset($requestData['assigned_to']) && $requestData['assigned_to'] != "" ? (int)$requestData['assigned_to']['id'] : null;
		$assignedToName = isset($requestData['assigned_to']) && $requestData['assigned_to'] != "" ? $requestData['assigned_to']['name'] : null;
		$assignedTo = isset($requestData['assigned_to']) && $requestData['assigned_to'] != "" ? $requestData['assigned_to'] : null;
		$createdBy = isset($requestData['created_by']) && $requestData['created_by'] != "" ? $requestData['created_by'] : null;

		// $start_date = isset($requestData['start_date']) && $requestData['start_date']!='' && $requestData['start_date']!='null' ? gmdate('Y-m-d H:i:s', strtotime($requestData['start_date'])): null;
		// $end_date = isset($requestData['end_date']) && $requestData['end_date']!='' && $requestData['end_date']!='null' ? gmdate('Y-m-d H:i:s', strtotime($requestData['end_date'])): null;
		$start_date = null;
		$end_date = null;
		$start_date_is_visible = null;
		$end_date_is_visible = null;
		if(isset($requestData['start_date'])){
			$start_date = $requestData['start_date']!='empty' && $requestData['start_date'] !='null' && $requestData['start_date'] !='' ? gmdate('Y-m-d H:i:s', strtotime($requestData['start_date'])): null;
			$start_date_is_visible = $requestData['start_date_is_visible'];
		}
		if(isset($requestData['end_date'])){
			$end_date = $requestData['end_date']!='empty' && $requestData['end_date'] !='null' && $requestData['end_date'] !='' ? gmdate('Y-m-d', strtotime($requestData['end_date'])): null;
			$end_date_is_visible = $requestData['end_date_is_visible'];
		}

		$type = isset($requestData['type']) && $requestData['type'] != "" ? $requestData['type'] : 'task';

		$is_visible = isset($requestData['is_visible']) && $requestData['is_visible'] ? 1 : 0;

		$description = wp_kses_post($requestData['description']);
		$status = sanitize_text_field($requestData['status']);
		$created_at = current_time('mysql');
		$members = isset($requestData['members']) && sizeof($requestData['members'])> 0 ? $requestData['members'] : [];
		$tags = isset($requestData['tags']) && sizeof($requestData['tags'])> 0 ? $requestData['tags'] : [];

		$attachments = isset($requestData['attachments']) && sizeof($requestData['attachments'])> 0 ? $requestData['attachments'] : [];
		// Check if the required fields are present
		if (empty($name)) {
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}

		// Start a transaction
		$db->query('START TRANSACTION');
		// get the task section by id
		$taskSection = $this->getTaskSectionById($taskSectionId);
		//sort_order max value by section id and project id
		$sortOrder = $this->getMaxSortOrderBySectionId($taskSectionId, $projectId, $parent);

		// check the task serial start from
		$taskSerialSettings = get_option('lazytask_serial_settings', []);
		$isSerialEnabled = isset($taskSerialSettings['enabled']) ? $taskSerialSettings['enabled'] : false;
		$serialStartNumber = isset($taskSerialSettings['number']) ? $taskSerialSettings['number'] : 1;

		$lastSerial = $wpdb->get_var("SELECT MAX(serial_no) FROM " . self::TABLE_TASKS);
		if($parent){
			$lastSubSerial = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT MAX(serial_no) FROM " . self::TABLE_TASKS . " WHERE parent_id = %d",
					$parent
				)
			);
			$newSubSerial = $lastSubSerial ? $lastSubSerial + 1 : 1;
		}
		$newSerial = $parent ? $newSubSerial : ($lastSerial ? $lastSerial + 1 : $serialStartNumber);

		$argTask = array(
			"serial_no" => $newSerial,
			"name" => $name,
			"parent_id" => $parent,
			"project_id" => $projectId,
			"section_id" => $taskSectionId,
			"priority_id" => $priorityId,
			"internal_status_id" => $internal_status_id,
			"assigned_to" => $assignedToId,
			"start_date" => $start_date,
			"start_date_is_visible" => $start_date_is_visible,
			"end_date" => $end_date,
			"end_date_is_visible" => $end_date_is_visible,
			"created_by" => $createdBy,
			'slug' => $slug,
			"description" => $description,
			'sort_order' => $sortOrder,
			'is_visible_on_gantt' => $is_visible,
			"status" => $taskSection && $taskSection['mark_is_complete'] == 'complete' ? 'COMPLETED': 'ACTIVE',
			"created_at" => $created_at,
		);
		// Insert the task into the database
		$taskInserted = $db->insert(
			self::TABLE_TASKS,
			$argTask
		);

		// Check if the task was inserted successfully
		if (!$taskInserted) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_Error('db_insert_error', 'Could not insert task into the database.', array('status' => 500));
		}

		$taskId = $wpdb->insert_id;
		
		$mention_users = isset($requestData['mention_users']) && sizeof($requestData['mention_users']) > 0 ? $requestData['mention_users'] : [];
		$loggedInUser = get_user_by('ID', $createdBy);		
		foreach($mention_users as $mentioned_user){
			// Prepare data for notification
			$referenceInfo = [
				'id' => $id,
				'name' => $name, 
				'type' => 'mention'
			];
			
			$placeholdersArray = [
				'member_name' => $mentioned_user['name'],
				'task_name' => $name,
				'project_name' => '',
				'creator_name' => $loggedInUser ? $loggedInUser->display_name : '',
				'description' => $description
			];
			// Trigger notification action
			do_action(
				'lazytask_task_member_mention', 
				$referenceInfo,
				['web-app'],
				[$mentioned_user['id']],
				$placeholdersArray
			);
		}

		// Insert the task members into the database
		$memberArg = [];
		if(sizeof($members)>0){
			foreach ( $members as $member ) {
				if((int)$member['id']==0){
					$db->query('ROLLBACK');
					return new WP_Error('db_insert_error', 'Could not insert task member into the database.', array('status' => 500));
				}
				$memberArg[] = [
					'id' => $member['id'],
					'name' => $member['name'],
				];
				$memberInserted = $db->insert(self::TABLE_TASK_MEMBERS, array(
					"task_id" => $taskId,
					"user_id" => (int)$member['id'],
					"created_at" => $created_at,
					"updated_at" => $created_at,
				));

				if (!$memberInserted) {
					// Rollback the transaction
					$db->query('ROLLBACK');
					return new WP_Error('db_insert_error', 'Could not insert task member into the database.', array('status' => 500));
				}
			}
		}

		if($tags && sizeof($tags)>0){
			$taskTagsTable = LAZYTASK_TABLE_PREFIX . 'task_tags';

			$tagObj = new Lazytask_TagController();

			foreach ( $tags as $tag ) {
				$submittedTag = [
					'name' => $tag,
					'user_id' => $createdBy,
				];
			  $assignedTags =$tagObj->tagGetOrCreate($submittedTag);

			  if($assignedTags) {
				  $db->insert(
					  $taskTagsTable,
					  array(
						  "task_id" => $taskId,
						  "tag_id" => $assignedTags['id'],
						  "user_id" => $createdBy,
						  "created_at" => $created_at,
						  )
				  );
			  }


			}
		}

		$attachmentArg = [];
		if ($attachments && sizeof($attachments)>0) {

			foreach ( $attachments as $attachment ) {

				$attachment_id = $attachment['id'];

				if($attachment_id){
					$tableAttachments = $wpdb->prefix. 'pms_attachments';
					$db->insert(
						$tableAttachments,
						array(
							'file_name'=>isset( $attachment['name']) ? $attachment['name']: null,
							'file_path'=>isset( $attachment['url']) ? $attachment['url']: null,
							'mine_type' => isset( $attachment['type']) ? $attachment['type']: null,
							'size' => isset( $attachment['size']) ? $attachment['size']: null,
							'wp_attachment_id' => $attachment_id,
							"subject_id" => $taskId,
							"subject_name" => 'task',
							"subject_type"=>'task',
							"user_id" => $createdBy,
							"created_at" => current_time('mysql'),
						)
					);
					$attachmentArg[] = $attachment_id;
				}

			}

		}

		$properties = [];

		if($memberArg && sizeof($memberArg)>0){
			$argTask['members'] = $memberArg;
		}

		if($priority){
			$argTask['priority_name'] = $priority['name'];
		}
		if($assignedTo){
			$argTask['assignedTo_name'] = $assignedTo['name'];
		}

		if( sizeof($attachmentArg) > 0 ) {
			$argTask['attachments'] = $attachmentArg;
		}

		$properties['attributes'] = $argTask;

		$activityLogArg = [
			"user_id" => $createdBy,
			"subject_id" => $taskId,
			"subject_name" => 'task',
			"subject_type" => $type,
			"event" => 'created',
			"properties" => wp_json_encode($properties),
			"created_at" => $created_at,
		];

		$activityLogInserted = $db->insert(self::TABLE_ACTIVITY_LOG, $activityLogArg);

		// Commit the transaction
		$db->query('COMMIT');

		$task = $this->getTaskById($taskId);
		if($task){
			$loggedInUserId = isset($requestData['created_by']) && $requestData['created_by']!='' ? (int)$requestData['created_by'] : null;
			$loggedInUser = get_user_by('ID', $loggedInUserId);
			if($task['assignedTo_id']){

				$referenceInfo = ['id'=>$task['id'], 'name'=>$task['name'], 'type'=>'task'];
				$placeholdersArray = [
					'member_name'=>$assignedToName,
					'task_name'=>$task['name'],
					'project_name' => isset($task['project']['name']) ? $task['project']['name']:'',
					'creator_name'=>$loggedInUser?$loggedInUser->display_name:''
				];

				do_action('lazytask_task_assigned_member',  $referenceInfo, ['web-app', 'sms', 'email', 'mobile'], [$task['assignedTo_id']], $placeholdersArray);
			}

			if($task['members'] && sizeof($task['members'])>0){
				foreach ($task['members'] as $member) {
					if($assignedToId && $member['id'] == $createdBy){

						$referenceInfo = ['id'=>$task['id'], 'name'=>$task['name'], 'type'=>'task'];
						$placeholdersArray = [
							'member_name' => $assignedToName,
							'task_name'=>$task['name'],
							'creator_name'=> $loggedInUser ? $loggedInUser->display_name : ''
						];

						do_action('lazytask_task_follow_by_own', $referenceInfo, ['web-app', 'email', 'mobile', 'sms'], [$assignedToId], $placeholdersArray);

					}elseif ($member['id'] != $createdBy){
						$memberName = $member['name'];

						$referenceInfo = ['id'=>$task['id'], 'name'=>$task['name'], 'type'=>'task'];
						$placeholdersArray = [
							'member_name' => $memberName,
							'task_name'=>$task['name'],
							'project_name' => isset($task['project']['name']) ? $task['project']['name']:'',
							'creator_name'=> $loggedInUser ? $loggedInUser->display_name : ''
						];

						do_action('lazytask_task_follow_to_other', $referenceInfo, ['web-app', 'email', 'mobile', 'sms'], [$member['id']], $placeholdersArray);
					}
				}
			}

			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task created successfully', 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}
		return new WP_Error('not_found', 'Task not found.', array('status' => 404));
	}

	private function getMaxSortOrderBySectionId( $sectionId, $projectId, $parent )
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$tableTasks = LAZYTASK_TABLE_PREFIX . 'tasks';

		if ( $parent ) {
			$sortOrder = $db->get_var(
				$db->prepare(
					"SELECT MAX(sort_order) FROM $tableTasks WHERE section_id = %d AND project_id = %d AND parent_id = %d",
					(int)$sectionId,
					(int)$projectId,
					(int)$parent
				)
			);
		} else {
			$sortOrder = $db->get_var(
				$db->prepare(
					"SELECT MAX(sort_order) FROM $tableTasks WHERE section_id = %d AND project_id = %d AND parent_id IS NULL",
					(int)$sectionId,
					(int)$projectId
				)
			);
		}

		return $sortOrder ? $sortOrder + 1 : 0;
	}

	// private function getMaxSortOrderTaskForGanttByProjectId( $projectId )
	// {
	// 	global $wpdb;
	// 	$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

	// 	$tableTasks = LAZYTASK_TABLE_PREFIX . 'tasks_for_gantt';

	// 	if ( $projectId ) {
	// 		$sortOrder = $db->get_var(
	// 			$db->prepare(
	// 				"SELECT COUNT(id) FROM $tableTasks WHERE project_id = %d",
	// 				(int)$projectId
	// 			)
	// 		);
	// 		return $sortOrder ? $sortOrder + 1 : 0;
	// 	}

	// 	return 0;
	// }


	public function update(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
		$taskSectionsTable = LAZYTASK_TABLE_PREFIX . 'task_sections';

		// Sanitize and validate the input data
		$id = $request->get_param('id');
		$requestData = $request->get_json_params();

		if(isset($requestData['members'])){
			$members = isset($requestData['members']) && $requestData['members'] != "" ? $requestData['members'] : [];
			// $members = $requestData['members'] ?? [];
		}else{
			$members = null;
		}

		if($id == null || $id == ''){
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}
		$prevTask = $this->getTaskById($id);

		if(!$prevTask){
			return new WP_Error('not_found', 'Task not found.', array('status' => 404));
		}

		$prevTaskMembers = $prevTask['members'];
		$prevTaskMembersId = sizeof($prevTaskMembers) > 0 ? array_column($prevTaskMembers, 'id'):[];

		// Start a transaction
		$db->query('START TRANSACTION');

		$submittedData = [];

		$properties = [];

		if(isset($requestData['name'])){
			$submittedData['name'] = sanitize_text_field($requestData['name']);

			if($prevTask['name'] != $submittedData['name']){
				$properties['old']['name'] = $prevTask['name'];
				$properties['attributes']['name'] = $submittedData['name'];
			}
		}

		if(isset($requestData['parent'])){
			$submittedData['parent_id'] = isset($requestData['parent']) && $requestData['parent'] != "" ? (int)$requestData['parent']['id'] : null;

			if($prevTask['parent_id'] != $submittedData['parent_id']){
				$properties['old']['parent_id'] = $prevTask['parent_id'];
				$properties['attributes']['parent_id'] = $submittedData['parent_id'];
			}
		}
		if(isset($requestData['project_id'])){
			$submittedData['project_id'] = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;

			if($prevTask['project_id'] != $submittedData['project_id']){
				$properties['old']['project_id'] = $prevTask['project_id'];
				$properties['attributes']['project_id'] = $submittedData['project_id'];
			}
		}
		if(isset($requestData['task_section_id'])){
			$submittedData['section_id'] = isset($requestData['task_section_id']) && $requestData['task_section_id'] != "" ? (int)$requestData['task_section_id'] : null;

			if($prevTask['task_section_id'] != $submittedData['section_id']){
				$properties['old']['section_id'] = $prevTask['task_section_id'];
				$properties['attributes']['section_id'] = $submittedData['section_id'];

				// Get the max sort_order from complete section
				$maxSortOrder = $db->get_var($db->prepare(
					"SELECT MAX(sort_order) FROM {$taskTable} WHERE section_id = %d",
					$requestData['task_section_id']
				));
			
				$newSortOrder = ($maxSortOrder !== null) ? $maxSortOrder + 1 : 0;
				$submittedData['sort_order'] = $newSortOrder;

				// Get the 'mark_is_complete' value for the selected section
				$sectionStatus = $db->get_var($db->prepare(
					"SELECT mark_is_complete FROM {$taskSectionsTable} WHERE id = %d",
					$requestData['task_section_id']
				));

				// Set task status based on section's completion status
				if ($sectionStatus !== null) {
					$submittedData['status'] = ($sectionStatus === 'complete') ? 'COMPLETED' : 'ACTIVE';
				}
				$subtasks = $this->getSubTasksByTaskId($id);
				if (!empty($subtasks) && isset($subtasks[$id]['child'])) {
					foreach ($subtasks[$id]['child'] as $subtask) {
						if (isset($subtask['id'])) {
							$db->update(
								$taskTable,
								[
									"section_id" => (int)$submittedData['section_id'],
									"updated_at" => current_time('mysql'),
								],
								['id' => $subtask['id']]
							);
						}
					}
				}
			}
		}
		if(isset($requestData['priority'])){
			$submittedData['priority_id'] = $requestData['priority'] != "" ? (int)$requestData['priority']['id'] : null;

			if($prevTask['priority_id'] != $submittedData['priority_id']){
				$properties['old']['priority_id'] = (int)$prevTask['priority_id'];
				$properties['old']['priority_name'] = isset( $prevTask['priority']) && $prevTask['priority'] ? $prevTask['priority']['name'] : '';
				$properties['attributes']['priority_id'] = (int)$submittedData['priority_id'];
				$properties['attributes']['priority_name'] = $requestData['priority'] ? $requestData['priority']['name'] : '';
			}
		}
		if(isset($requestData['internal_status'])){
			$submittedData['internal_status_id'] = $requestData['internal_status'] != "" ? (int)$requestData['internal_status']['id'] : null;

			if($prevTask['internal_status_id'] != $submittedData['internal_status_id']){
				$properties['old']['internal_status_id'] = (int)$prevTask['internal_status_id'];
				$properties['old']['status_name'] = isset( $prevTask['internal_status']) && $prevTask['internal_status'] ? $prevTask['internal_status']['name'] : '';
				$properties['attributes']['internal_status_id'] = (int)$submittedData['internal_status_id'];
				$properties['attributes']['status_name'] = $requestData['internal_status'] ? $requestData['internal_status']['name'] : '';
			}
		}
		if(isset($requestData['assigned_to'])){
			$submittedData['assigned_to'] = isset($requestData['assigned_to']) && $requestData['assigned_to'] != "" ? $requestData['assigned_to']['id'] : null;

			if($prevTask['assignedTo_id'] != $submittedData['assigned_to']){
				$properties['old']['assigned_to'] = isset($prevTask['assigned_to']['id']) ? (int)$prevTask['assigned_to']['id'] : null;
				$properties['old']['assignedTo_name'] = isset($prevTask['assigned_to']['name']) ? $prevTask['assigned_to']['name'] : '';
				$properties['attributes']['assigned_to'] = (int)$submittedData['assigned_to'];
				$properties['attributes']['assignedTo_name'] = $requestData['assigned_to'] != "" ? $requestData['assigned_to']['name'] : '';
			}

		}
		if(isset($requestData['description'])){
			$submittedData['description'] = wp_kses_post($requestData['description']);
			$mention_users = isset($requestData['mention_users']) && sizeof($requestData['mention_users']) > 0 ? $requestData['mention_users'] : [];

			if($prevTask['description'] != $submittedData['description'] && !empty($mention_users)){
				$loggedInUserId = isset($requestData['updated_by']) ? (int)$requestData['updated_by'] : null;
				$loggedInUser = get_user_by('ID', $loggedInUserId);
				
				foreach($mention_users as $mentioned_user){
					// Prepare data for notification
					$referenceInfo = [
						'id' => $id,
						'name' => $prevTask['name'], 
						'type' => 'mention'
					];
					
					$placeholdersArray = [
						'member_name' => $mentioned_user['name'],
						'task_name' => $prevTask['name'],
						'project_name' => isset($prevTask['project']['name']) ? $prevTask['project']['name'] : '',
						'creator_name' => $loggedInUser ? $loggedInUser->display_name : '',
						'description' => $submittedData['description']
					];
					// Trigger notification action
					do_action(
						'lazytask_task_member_mention', 
						$referenceInfo,
						['web-app'],
						[$mentioned_user['id']],
						$placeholdersArray
					);
				}
			}

			// do_action('lazytask_task_follow_by_own', $referenceInfo, ['web-app', 'email', 'mobile', 'sms'], [$assigned_to_id], $placeholdersArray);
			if($prevTask['description'] != $submittedData['description']){
				$properties['old']['description'] = $prevTask['description'];
				$properties['attributes']['description'] = $submittedData['description'];
			}
		}
		
		if(isset($requestData['status'])){
			$submittedData['status'] = sanitize_text_field($requestData['status']);
		}
		if(isset($requestData['start_date'])){
			$submittedData['start_date'] = $requestData['start_date']!='empty' && $requestData['start_date'] !='null' && $requestData['start_date'] !='' ? gmdate('Y-m-d H:i:s', strtotime($requestData['start_date'])): null;
			$submittedData['start_date_is_visible'] = $requestData['start_date_is_visible'];
		}
		if(isset($requestData['end_date'])){
			$submittedData['end_date'] = $requestData['end_date']!='empty' && $requestData['end_date'] !='null' && $requestData['end_date'] !='' ? gmdate('Y-m-d', strtotime($requestData['end_date'])): null;
			$submittedData['end_date_is_visible'] = $requestData['end_date_is_visible'];

			if($prevTask['end_date'] != $submittedData['end_date']){
				$properties['old']['end_date'] = $prevTask['end_date'];
				$properties['attributes']['end_date'] = $submittedData['end_date'];
			}
		}

		if ( isset($requestData['is_visible']) ){
			$is_visible_on_gantt = isset($requestData['is_visible']) && $requestData['is_visible'] ? 1 : 0;
			$submittedData['is_visible_on_gantt'] = $is_visible_on_gantt;

			$currentTask = $this->getTaskById($id);
			
			if($currentTask && empty($currentTask['parent_id'])){
				$subtasks = $this->getSubTasksByTaskId($id);
				if (!empty($subtasks) && isset($subtasks[$id]['child'])) {
					foreach ($subtasks[$id]['child'] as $subtask) {
						if (isset($subtask['id'])) {
							$db->update(
								self::TABLE_TASKS,
								['is_visible_on_gantt' => $is_visible_on_gantt],
								['id' => $subtask['id']]
							);
						}
					}
				}
			}
		}



		// Update the task in the database
		if(sizeof($submittedData)>0){
			if(isset($requestData['updated_by'])){
				$submittedData['updated_by'] = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;
			}
			$submittedData['updated_at'] = current_time('mysql');

			
			$taskUpdated = $db->update(
				$taskTable,
				$submittedData,
				array('id' => $id)
			);

			// Check if the task was updated successfully
			if (!$taskUpdated) {
				// Rollback the transaction
				$db->query('ROLLBACK');
				return new WP_Error('db_update_error', 'Could not update task in the database.', array('status' => 500));
			}
		}

		// Update the task members in the database
		if( $members !== null ) {
			$loggedInUserId = isset($requestData['updated_by']) && $requestData['updated_by']!="" ? $requestData['updated_by'] : null;
			$loggedInUser = get_user_by('ID', $loggedInUserId);

			$taskMembersTable = LAZYTASK_TABLE_PREFIX . 'task_members';
			$db->delete($taskMembersTable, array('task_id' => $id));
			$updatedAt = current_time('mysql');
			$createdAt = current_time('mysql');
			if ( $members > 0){
				foreach ( $members as $member ) {

					if((int)$member['id']==0){
						$db->query('ROLLBACK');
						return new WP_Error('db_update_error', 'Could not update task member in the database.', array('status' => 500));
					}
					$memberInserted = $db->insert($taskMembersTable, array(
						"task_id" => $id,
						"user_id" => (int)$member['id'],
						"created_at" => $createdAt,
						"updated_at" => $updatedAt,
					));

					if (!$memberInserted) {
						// Rollback the transaction
						$db->query('ROLLBACK');
						return new WP_Error('db_update_error', 'Could not update task member in the database.', array('status' => 500));
					}

					$assigned_to_id = isset($prevTask['assigned_to']) && $prevTask['assigned_to'] != "" ? $prevTask['assigned_to']['id'] : null;

					if($assigned_to_id && !in_array($member['id'], $prevTaskMembersId) && $member['id'] == $loggedInUserId){
						$assignedToName = isset($prevTask['assigned_to']) && $prevTask['assigned_to'] != "" ? $prevTask['assigned_to']['name'] : null;

						$memberName = $members[array_search($member['id'], array_column($members, 'id'))]['name'];

						$referenceInfo = ['id'=>$id, 'name'=>$prevTask['name'], 'type'=>'task'];
						$placeholdersArray = ['member_name' => $assignedToName, 'task_name'=>$prevTask['name'], 'creator_name'=> $memberName];

						do_action('lazytask_task_follow_by_own', $referenceInfo, ['web-app', 'email', 'mobile', 'sms'], [$assigned_to_id], $placeholdersArray);
					}elseif(!in_array($member['id'], $prevTaskMembersId) && $member['id'] != $loggedInUserId){
						$memberName = $members[array_search($member['id'], array_column($members, 'id'))]['name'];

						$referenceInfo = ['id'=>$id, 'name'=>$prevTask['name'], 'type'=>'task'];
						$placeholdersArray = ['member_name' => $memberName, 'task_name'=>$prevTask['name'], 'creator_name'=> $loggedInUser ? $loggedInUser->display_name : ''];

						do_action('lazytask_task_follow_to_other', $referenceInfo, ['web-app', 'email', 'mobile', 'sms'], [$member['id']], $placeholdersArray);
					}
				}
			}
		}

		$createdBy = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;
		$created_at = current_time('mysql');

		if( sizeof($properties) > 0 ) {
			$activityLogArg = [
				"user_id" => $createdBy,
				"subject_id" => $id,
				"subject_name" => 'task',
				"subject_type" => isset($prevTask['parent']) && $prevTask['parent'] ? 'sub-task':'task',
				"event" => 'updated',
				"properties" => wp_json_encode($properties),
				"created_at" => $created_at,
			];
			$activitiesLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';

			$db->insert($activitiesLogTable, $activityLogArg);
		}
		// Commit the transaction
		$db->query('COMMIT');

		$task = $this->getTaskById($id);

		if(isset($requestData['assigned_to'])){
			$assigned_to_id = isset($requestData['assigned_to']) && $requestData['assigned_to'] != "" ? $requestData['assigned_to']['id'] : null;

			if($prevTask['assignedTo_id'] != $assigned_to_id){
				$assignedToName = isset($requestData['assigned_to']) && $requestData['assigned_to'] != "" ? $requestData['assigned_to']['name'] : null;
				$loggedInUserId = isset($requestData['updated_by']) && $requestData['updated_by']!='' ? (int)$requestData['updated_by'] : null;
				$loggedInUser = get_user_by('ID', $loggedInUserId);

				$referenceInfo = ['id'=>$task['id'], 'name'=>$task['name'], 'type'=>'task'];
				$placeholdersArray = [
					'member_name'=>$assignedToName,
					'task_name'=>$task['name'],
					'project_name' => isset($task['project']['name']) ? $task['project']['name']:'',
					'creator_name'=>$loggedInUser?$loggedInUser->display_name:''
				];

				do_action('lazytask_task_assigned_member',  $referenceInfo, ['web-app', 'sms', 'email', 'mobile'], [$task['assignedTo_id']], $placeholdersArray);
			}
		}

		if(isset($requestData['end_date'])){
			$submittedData['end_date'] = $requestData['end_date']!=''? gmdate('Y-m-d', strtotime($requestData['end_date'])): null;

			if($prevTask['end_date'] != $submittedData['end_date']){
				$assignedToName = isset($task['assigned_to']) && $task['assigned_to'] != "" ? $task['assigned_to']['name'] : null;
				$loggedInUserId = isset($requestData['updated_by']) && $requestData['updated_by']!='' ? (int)$requestData['updated_by'] : null;
				$loggedInUser = get_user_by('ID', $loggedInUserId);

				$referenceInfo = ['id'=>$task['id'], 'name'=>$task['name'], 'type'=>'task'];
				$placeholdersArray = [
					'member_name'=>$assignedToName,
					'task_name'=>$task['name'],
					'project_name' => isset($task['project']['name']) ? $task['project']['name']:'',
					'previous_assigned_date' => $prevTask['end_date'],
					'new_assigned_date' => $submittedData['end_date'],
					'creator_name'=>$loggedInUser?$loggedInUser->display_name:''
				];
				if($task['assignedTo_id']){
					do_action('lazytask_task_deadline_changed',  $referenceInfo, ['web-app', 'email', 'sms', 'mobile'], [$task['assignedTo_id']], $placeholdersArray);
				}

			}
		}

		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task updated successfully', 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn, 'loggedUserID'=>$createdBy ], 200);
		}
		return new WP_Error('not_found', 'Task not found.', array('status' => 404));
	}


	public function updateTaskSortOrder(WP_REST_Request $request)
	{
		global $wpdb;

		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$tableTasks = LAZYTASK_TABLE_PREFIX . 'tasks';


		$requestData = $request->get_json_params();

		$project_id = $requestData['project_id'];
		$orderedList = $requestData['orderedList'];
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$entityId = $orderedList && isset($orderedList['draggableId'])?$orderedList['draggableId']:null;
		$destinationSlug = $orderedList && isset($orderedList['destination']['droppableId'])?$orderedList['destination']['droppableId']:null;
		$sourceSlug = $orderedList && isset($orderedList['source']['droppableId'])?$orderedList['source']['droppableId']:null;
		$type = $orderedList && isset($orderedList['type'])?$orderedList['type']:'';
		$sortOrder = $orderedList && isset($orderedList['destination']['index'])?$orderedList['destination']['index']:0;
		$updateColumnData = $orderedList && isset($orderedList['updateColumnData'])?$orderedList['updateColumnData']:[];

		if(!$project_id){
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}

		if($entityId && $destinationSlug){
			$db->query('START TRANSACTION');
			if($type=="SUBTASK"){

				if($destinationSlug != $sourceSlug){
					$destinationParentTask = $this->getParentTaskBySlug($destinationSlug, $project_id);
					$destinationParentTaskId = $destinationParentTask  ? $destinationParentTask['id']: '';
					if($destinationParentTaskId){
						$db->update(
							$tableTasks,
							array(
								"parent_id" => (int)$destinationParentTaskId,
								"section_id" => (int)$destinationParentTask['section_id'],
								"sort_order" => (int)$sortOrder,
								"updated_at" => $updated_at,
								"updated_by" => $updated_by,
							),
							array( 'project_id' => $project_id, 'id' => $entityId )
						);
					}
				}

			}else{
				if($destinationSlug != $sourceSlug){

					$prevTask = $this->getTaskById($entityId);

					$destinationSection = $this->getTaskSectionsByProjectId($project_id);
					$destinationSectionId = $destinationSection && isset($destinationSection[$destinationSlug]) ? $destinationSection[$destinationSlug]['id']: '';
					$destinationSectionName = $destinationSection && isset($destinationSection[$destinationSlug]) ? $destinationSection[$destinationSlug]['name']: '';
					$destinationSectionMarkIsComplete = $destinationSection && isset($destinationSection[$destinationSlug]) && $destinationSection[$destinationSlug]['mark_is_complete'] == 'complete' ? 'COMPLETED': 'ACTIVE';
					if($destinationSectionId){
						$db->update(
							$tableTasks,
							array(
								"section_id" => (int)$destinationSectionId,
								"sort_order" => (int)$sortOrder,
								"updated_at" => $updated_at,
								"updated_by" => $updated_by,
								"status" => $destinationSectionMarkIsComplete,
							),
							array( 'project_id' => $project_id, 'id' => $entityId )
						);

						// Update subtasks' section
						$subtasks = $this->getSubTasksByTaskId($entityId);
						if (!empty($subtasks) && isset($subtasks[$entityId]['child'])) {
							foreach ($subtasks[$entityId]['child'] as $subtask) {
								if (isset($subtask['id'])) {
									$db->update(
										$tableTasks,
										[
											"section_id" => (int)$destinationSectionId,
											"updated_at" => $updated_at,
											"updated_by" => $updated_by,
										],
										['id' => $subtask['id']]
									);
								}
							}
						}

						$createdBy = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;
						$created_at = current_time('mysql');

						$properties = [];

						$properties['old']['section_id'] = $prevTask['task_section_id'];
						$properties['old']['section_name'] = $prevTask['section_name'];

						$properties['attributes']['section_id'] = $destinationSectionId;
						$properties['attributes']['section_name'] = $destinationSectionName;

						if( sizeof($properties) > 0 ) {
							$activityLogArg = [
								"user_id" => $createdBy,
								"subject_id" => $entityId,
								"subject_name" => 'task',
								"subject_type" => isset($prevTask['parent']) && $prevTask['parent'] ? 'sub-task':'task',
								"event" => 'updated',
								"properties" => wp_json_encode($properties),
								"created_at" => $created_at,
							];

							$db->insert(self::TABLE_ACTIVITY_LOG, $activityLogArg);
						}
					}
				}

			}

			if(sizeof($updateColumnData)>0){

				if($destinationSlug == $sourceSlug){
					if(isset($updateColumnData[$destinationSlug]) && sizeof($updateColumnData[$destinationSlug])>0){
						foreach ($updateColumnData[$destinationSlug] as $sortOrder => $value) {
							$db->update(
								$tableTasks,
								array(
									"sort_order" => (int)$sortOrder,
									"updated_at" => $updated_at,
									"updated_by" => $updated_by,
								),
								array( 'project_id' => $project_id, 'id' => $value['id'] )
							);
						}
					}

				}elseif ($destinationSlug != $sourceSlug){
					if(isset($updateColumnData[$destinationSlug]) && sizeof($updateColumnData[$destinationSlug])>0){
						foreach ($updateColumnData[$destinationSlug] as $sortOrder => $value) {
							$db->update(
								$tableTasks,
								array(
									"sort_order" => (int)$sortOrder,
									"updated_at" => $updated_at,
									"updated_by" => $updated_by,
								),
								array( 'project_id' => $project_id, 'id' => $value['id'] )
							);
						}
					}

					if(isset($updateColumnData[$sourceSlug]) && sizeof($updateColumnData[$sourceSlug])>0){
						foreach ($updateColumnData[$sourceSlug] as $sortOrder => $value) {
							$db->update(
								$tableTasks,
								array(
									"sort_order" => (int)$sortOrder,
									"updated_at" => $updated_at,
									"updated_by" => $updated_by,
								),
								array( 'project_id' => $project_id, 'id' => $value['id'] )
							);
						}
					}
				}
			}


			$db->query('COMMIT');

		}

		return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $updateColumnData], 200);

	}

	public function getPaginatedTasksByProjectId($projectId, $requestData)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		//search filter added by tasks name when search is not empty
		$searchFilter = '';
		if (isset($requestData['search']) && $requestData['search'] != '') {
			$search = '%' . $db->esc_like($requestData['search']) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}

		if (isset($requestData['name']) && $requestData['name'] != '') {
			$search = '%' . $db->esc_like($requestData['name']) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}
		if( isset($requestData['section_id']) && $requestData['section_id'] != '' ){
			$sectionId = $requestData['section_id'];
			$searchFilter .= $db->prepare(" AND tasks.section_id = %d", (int)$sectionId);
		}
		//assigned_to search
		if (isset($requestData['assigned_to']) && $requestData['assigned_to'] != '') {
			$assignedToId = $requestData['assigned_to'];
			$searchFilter .= $db->prepare(" AND tasks.assigned_to = %d", (int)$assignedToId);
		}
		//priority_id
		if (isset($requestData['priority_id']) && $requestData['priority_id'] != '') {
			$priorityId = $requestData['priority_id'];
			$searchFilter .= $db->prepare(" AND tasks.priority_id = %d", (int)$priorityId);
		}
		//internal_status_id
		if (isset($requestData['internal_status_id']) && $requestData['internal_status_id'] != '') {
			$internalStatusId = $requestData['internal_status_id'];
			$searchFilter .= $db->prepare(" AND tasks.internal_status_id = %d", (int)$internalStatusId);
		}

		//date_type search
		if (isset($requestData['date_type']) && $requestData['date_type'] != '') {
			$dateType = $requestData['date_type'];
			if ($dateType == 'today') {
				$currentDate = gmdate('Y-m-d');
				$searchFilter .= $db->prepare(" AND DATE(tasks.end_date) = %s", $currentDate);
			} elseif ($dateType == 'next_seven_days') {
				$nextSevenDays = gmdate('Y-m-d', strtotime('+7 days'));
				$searchFilter .= $db->prepare(" AND tasks.end_date BETWEEN %s AND %s", gmdate('Y-m-d'), $nextSevenDays);
			} elseif ($dateType == 'upcoming') {
				$searchFilter .= $db->prepare(" AND tasks.end_date > %s", gmdate('Y-m-d'));
			} elseif ($dateType == 'overdue') {
				$searchFilter .= $db->prepare(" AND tasks.end_date < %s", gmdate('Y-m-d'));
			} elseif ($dateType == 'no-date') {
				$searchFilter .= " AND  tasks.end_date IS NULL";
			}
		}

		$limit = $requestData['limit'];
		$offset = $requestData['offset'];
		$limitPlusOne = $limit+1;

		//isVisibleGanttChart search

		if (isset($requestData['isVisibleGanttChart'])) {
			$isVisibleGanttChart = $requestData['isVisibleGanttChart'];
			if($isVisibleGanttChart == 'true'){
				$searchFilter .= " AND tasks.is_visible_on_gantt = 1";
			}
		}

		$parentResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder, tasks.privacy as taskPrivacy, 
       tasks.is_visible_on_gantt as ganttIsVisible, projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
       createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
       internal_status.id as statusId, internal_status.name as statusName, internal_status.color_code as status_color_code, internal_status.sort_order as status_sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
FROM {$wpdb->prefix}pms_tasks as tasks
    JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
    LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
    LEFT JOIN {$wpdb->prefix}pms_project_statuses as internal_status ON tasks.internal_status_id = internal_status.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
         WHERE tasks.deleted_at IS NULL AND tasks.parent_id IS NULL AND projects.id = %d AND tasks.section_id = %d {$searchFilter} AND tasks.status IN ('ACTIVE', 'COMPLETED') AND taskSections.mark_is_complete IN ('regular', 'complete') order by tasks.sort_order ASC LIMIT %d OFFSET %d", (int)$projectId, (int)$sectionId, (int)$limitPlusOne, (int)$offset), ARRAY_A);

		// $hasMore = count($parentResults) > $limit;
		if (count($parentResults) > $limit) {
			$hasMore = true;
			$parentResults = array_slice($parentResults, 0, $limit);
		} else {
			$hasMore = false;
		}
		$taskSerialSettings = get_option('lazytask_serial_settings', []);
		$isSerialEnabled = isset($taskSerialSettings['enabled']) ? $taskSerialSettings['enabled'] : false;

		$returnArray = null;
		$returnArray['hasMore'] = $hasMore;
		if ($parentResults){
			// $parentResults = array_filter($allResults, function($item)  {
			// 	return $item['parentId'] == '' && $item['parentId'] == null;
			// });

			$tasksId = array_column($parentResults, 'taskId');
			// $taskMembers = $this->getTaskMembers($tasksId);

			// $taskComments = $this->getCommentsByTaskId($tasksId, 'task');

			// $taskActivityLogs = $this->getActivityLogsByTaskId($tasksId, 'task');

			// $taskAttachments = $this->getAttachmentsByTaskId($tasksId, 'task');

			$taskTags = $this->getTaskTagsByTaskId($tasksId);

			// $childResults = array_filter($allResults, function($item)  {
			// 	return $item['parentId'] != '' && $item['parentId'] != null;
			// });

			$childTasks = [];
    		if (!empty($tasksId)) {
        		$inClause = implode(',', array_map('intval', $tasksId));
				$childResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder, tasks.privacy as taskPrivacy,
       tasks.is_visible_on_gantt as ganttIsVisible, projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
       createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
       internal_status.id as statusId, internal_status.name as statusName, internal_status.color_code as status_color_code, internal_status.sort_order as status_sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
FROM {$wpdb->prefix}pms_tasks as tasks
    JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
    LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
    LEFT JOIN {$wpdb->prefix}pms_project_statuses as internal_status ON tasks.internal_status_id = internal_status.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
         WHERE tasks.deleted_at IS NULL AND tasks.parent_id IN ($inClause) AND projects.id = %d AND tasks.section_id = %d {$searchFilter} AND tasks.status IN ('ACTIVE', 'COMPLETED') AND taskSections.mark_is_complete IN ('regular', 'complete') order by tasks.sort_order ASC", (int)$projectId, (int)$sectionId), ARRAY_A);
			}

			$childArray = [];
			if($childResults){
				$childTaskIds = array_column($childResults, 'taskId');
    			$allTaskIds = array_merge($tasksId, $childTaskIds);
				$taskMembers = $this->getTaskMembers($allTaskIds);

				foreach ($childResults as $value) {
					$parentId = $value['parentId'];

					$assignedTo = null;
					if($value['assignedToId']){
						$assignedTo = [
							'id' => $value['assignedToId'],
							'name' => $value['assignedToName'],
							'email' => $value['assignedToEmail'],
							'username' => $value['assignedToUsername'],
							'created_at' => $value['assignedToCreatedAt'],
							'avatar' => Lazytask_UserController::getUserAvatar($value['assignedToId']),
						];
					}
					$priority = null;
					if($value['priorityId']){
						$priority = [
							'id' => $value['priorityId'],
							'name' => $value['priorityName'],
							'project_id' => $value['projectId'],
							'color_code' => $value['color_code'],
							'sort_order' => $value['sort_order'],
						];
					}

					$status = null;
					if($value['statusId']){
						$status = [
							'id' => $value['statusId'],
							'name' => $value['statusName'],
							'project_id' => $value['projectId'],
							'color_code' => $value['status_color_code'],
							'sort_order' => $value['status_sort_order'],
						];
					}

					$childArray[$parentId][] = [
						'id' => $value['taskId'],
						'createdBy_id' => $value['createdBy_id'],
						'createdBy_name' => $value['createdBy_name'],
						'task_section_id' => $value['sectionId'],
						'section_slug' => $value['sectionSlug'],
						'section_name' => trim($value['sectionName']),
						'task_serial_no' => $value['taskSerialNo'],
						'name' => $value['taskName'],
						'slug' => $value['taskSlug'],
						'description' => $value['taskDescription'],
						'sort_order' => $value['sortOrder'],
						'assigned_to' => $assignedTo,
						'assignedTo_id' => $value['assignedToId'],
						'start_date'=> $value['start_date'],
						'end_date'=> $value['end_date'],
						'start_date_is_visible' => $value['start_date_is_visible']==1,
						'end_date_is_visible' => $value['end_date_is_visible']==1,
						'status'=> $value['taskStatus'],
						'priority_id'=> $value['priorityId'],
						'priority'=> $priority,
						'internal_status_id'=> $value['statusId'],
						'internal_status'=> $status,
						'project_id'=> $value['projectId'],
						'parent_id'=> $value['parentId'] ?: 0,
						'parent'=> [
							'id' => $value['taskParentId'],
							'name' => $value['taskParentName'],
							'slug' => $value['taskParentSlug'],
							'description' => $value['taskParentDescription']
						],
						'created_at'=> $value['taskCreatedAt'],
						'updated_at'=> $value['taskUpdatedAt'],
						'members' => isset($taskMembers[ $value['taskId'] ]) ? $taskMembers[ $value['taskId'] ] :[],
						'comments' => isset($taskComments[ $value['taskId'] ]) && sizeof($taskComments[ $value['taskId'] ]) > 0 ? $taskComments[ $value['taskId'] ] :[],
						'logActivities' => isset($taskActivityLogs[ $value['taskId'] ]) && sizeof($taskActivityLogs[ $value['taskId'] ]) > 0 ? $taskActivityLogs[ $value['taskId'] ] :[],
						'attachments' => isset($taskAttachments[ $value['taskId'] ]) && sizeof($taskAttachments[ $value['taskId'] ]) > 0 ? $taskAttachments[ $value['taskId'] ] :[],
						'tags' => isset($taskTags[ $value['taskId'] ]) && sizeof($taskTags[ $value['taskId'] ]) > 0 ? $taskTags[ $value['taskId'] ] :[],
						'ganttIsVisible' => (int)$value['ganttIsVisible'] ?? 0,
						'taskPrivacy' => $value['taskPrivacy'],
					];

					$returnArray['taskData'][$value['taskId']]= [
						'id' => $value['taskId'],
						'createdBy_id' => $value['createdBy_id'],
						'createdBy_name' => $value['createdBy_name'],
						'project_id'=> $value['projectId'],
						'task_section_id' => $value['sectionId'],
						'section_slug' => $value['sectionSlug'],
						'section_name' => trim($value['sectionName']),
						'name' => $value['taskName'],
						'slug' => $value['taskSlug'],
						'description' => $value['taskDescription'],
						'sort_order' => $value['sortOrder'],
						'assigned_to' => $assignedTo,
						'assignedTo_id' => $value['assignedToId'],
						'start_date'=> $value['start_date'],
						'end_date'=> $value['end_date'],
						'start_date_is_visible' => $value['start_date_is_visible']==1,
						'end_date_is_visible' => $value['end_date_is_visible']==1,
						'status'=> $value['taskStatus'],
						'priority_id'=> $value['priorityId'],
						'priority'=> $priority,
						'internal_status_id'=> $value['statusId'],
						'internal_status'=> $status,
						'parent_id'=> $value['parentId'] ?: 0,
						'parent'=> [
							'id' => $value['taskParentId'],
							'name' => $value['taskParentName'],
							'slug' => $value['taskParentSlug'],
							'description' => $value['taskParentDescription']
						],
						'created_at'=> $value['taskCreatedAt'],
						'updated_at'=> $value['taskUpdatedAt'],
						'members' => isset($taskMembers[ $value['taskId'] ]) ? $taskMembers[ $value['taskId'] ] :[],
						'comments' => isset($taskComments[ $value['taskId'] ]) && sizeof($taskComments[ $value['taskId'] ]) > 0 ? $taskComments[ $value['taskId'] ] :[],
						'logActivities' => isset($taskActivityLogs[ $value['taskId'] ]) && sizeof($taskActivityLogs[ $value['taskId'] ]) > 0 ? $taskActivityLogs[ $value['taskId'] ] :[],
						'attachments' => isset($taskAttachments[ $value['taskId'] ]) && sizeof($taskAttachments[ $value['taskId'] ]) > 0 ? $taskAttachments[ $value['taskId'] ] :[],
						'tags' => isset($taskTags[ $value['taskId'] ]) && sizeof($taskTags[ $value['taskId'] ]) > 0 ? $taskTags[ $value['taskId'] ] :[],
						'ganttIsVisible' => (int)$value['ganttIsVisible'] ?? 0,
						'taskPrivacy' => $value['taskPrivacy'],
					];
				}
			}

			foreach ( $parentResults as $key => $result ) {

				$assignedTo = null;
				if($result['assignedToId']){
					$assignedTo = [
						'id' => $result['assignedToId'],
						'name' => $result['assignedToName'],
						'email' => $result['assignedToEmail'],
						'username' => $result['assignedToUsername'],
						'created_at' => $result['assignedToCreatedAt'],
						'avatar' => Lazytask_UserController::getUserAvatar($result['assignedToId']),
					];
				}
				$priority = null;
				if($result['priorityId']){
					$priority = [
						'id' => $result['priorityId'],
						'name' => $result['priorityName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['color_code'],
						'sort_order' => $result['sort_order'],
					];
				}
				
				$status = null;
				if($result['statusId']){
					$status = [
						'id' => $result['statusId'],
						'name' => $result['statusName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['status_color_code'],
						'sort_order' => $result['status_sort_order'],
					];
				}

				$returnArray['sectionData'][trim($result['sectionSlug'])][] = [
					'id' => $result['taskId'],
					'createdBy_id' => $result['createdBy_id'],
					'createdBy_name' => $result['createdBy_name'],
					'project_id'=> $result['projectId'],
					'task_section_id' => $result['sectionId'],
					'section_slug' => $result['sectionSlug'],
					'section_name' => trim($result['sectionName']),
					'is_serial_enable' => $isSerialEnabled,
					'task_serial_no' => $result['taskSerialNo'],
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'sort_order' => $result['sortOrder'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible']==1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['statusId'],
					'internal_status'=> $status,
					'parent_id'=> $result['parentId'] ?: 0,
					'parent'=> null,
					'created_at'=> $result['taskCreatedAt'],
					'updated_at'=> $result['taskUpdatedAt'],
					'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
					'children' => isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[],
					//'comments' => isset($taskComments[ $result['taskId'] ]) && sizeof($taskComments[ $result['taskId'] ]) > 0 ? $taskComments[ $result['taskId'] ] :[],
					//'logActivities' => isset($taskActivityLogs[ $result['taskId'] ]) && sizeof($taskActivityLogs[ $result['taskId'] ]) > 0 ? $taskActivityLogs[ $result['taskId'] ] :[],
					//'attachments' => isset($taskAttachments[ $result['taskId'] ]) && sizeof($taskAttachments[ $result['taskId'] ]) > 0 ? $taskAttachments[ $result['taskId'] ] :[],
					'tags' => isset($taskTags[ $result['taskId'] ]) && sizeof($taskTags[ $result['taskId'] ]) > 0 ? $taskTags[ $result['taskId'] ] :[],
					'ganttIsVisible' => (int)$result['ganttIsVisible'] ?? 0,
					'taskPrivacy' => $result['taskPrivacy'],
				];

				$returnArray['taskData'][$result['taskId']]= [
					'id' => $result['taskId'],
					'createdBy_id' => $result['createdBy_id'],
					'createdBy_name' => $result['createdBy_name'],
					'project_id'=> $result['projectId'],
					'task_section_id' => $result['sectionId'],
					'section_slug' => $result['sectionSlug'],
					'section_name' => trim($result['sectionName']),
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'sort_order' => $result['sortOrder'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible']==1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['statusId'],
					'internal_status'=> $status,
					'parent_id'=> $result['parentId'] ?: 0,
					'parent'=> null,
					'created_at'=> $result['taskCreatedAt'],
					'updated_at'=> $result['taskUpdatedAt'],
					'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
					'children' => isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[],
					//'comments' => isset($taskComments[ $result['taskId'] ]) && sizeof($taskComments[ $result['taskId'] ]) > 0 ? $taskComments[ $result['taskId'] ] :[],
					//'logActivities' => isset($taskActivityLogs[ $result['taskId'] ]) && sizeof($taskActivityLogs[ $result['taskId'] ]) > 0 ? $taskActivityLogs[ $result['taskId'] ] :[],
					//'attachments' => isset($taskAttachments[ $result['taskId'] ]) && sizeof($taskAttachments[ $result['taskId'] ]) > 0 ? $taskAttachments[ $result['taskId'] ] :[],
					'tags' => isset($taskTags[ $result['taskId'] ]) && sizeof($taskTags[ $result['taskId'] ]) > 0 ? $taskTags[ $result['taskId'] ] :[],
					'ganttIsVisible' => (int)$result['ganttIsVisible'] ?? 0,
					'taskPrivacy' => $result['taskPrivacy'],
				];

				$returnArray['childData'][$result['taskSlug']] = isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[];
			}
		}
		return $returnArray;
	}

	public function getPaginatedTasks($projectId, $requestData, $groupBy = 'priority')
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		//search filter added by tasks name when search is not empty
		$searchFilter = '';
		if (isset($requestData['search']) && $requestData['search'] != '') {
			$search = '%' . $db->esc_like($requestData['search']) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}

		if (isset($requestData['name']) && $requestData['name'] != '') {
			$search = '%' . $db->esc_like($requestData['name']) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}
		if( isset($requestData['section_id']) && $requestData['section_id'] != '' ){
			$sectionId = $requestData['section_id'];
			$searchFilter .= $db->prepare(" AND tasks.section_id = %d", (int)$sectionId);
		}
		//assigned_to search
		if (isset($requestData['assigned_to']) && $requestData['assigned_to'] != '') {
			$assignedToId = $requestData['assigned_to'];
			if ($assignedToId === 'none' || $assignedToId === 'null') {
				$searchFilter .= " AND tasks.assigned_to IS NULL";
			}else if (is_numeric($assignedToId)) {
				$searchFilter .= $db->prepare(" AND tasks.assigned_to = %d", (int)$assignedToId);
			}
		}
		//priority_id
		if (isset($requestData['priority_id']) && $requestData['priority_id'] != '') {
			$priorityId = $requestData['priority_id'];
			if ($priorityId === 'none' || $priorityId === 'null') {
				$searchFilter .= " AND tasks.priority_id IS NULL";
			}else if (is_numeric($priorityId)) {
				$searchFilter .= $db->prepare(" AND tasks.priority_id = %d", (int)$priorityId);
			}
		}
		//internal_status_id
		if (isset($requestData['internal_status_id']) && $requestData['internal_status_id'] != '') {
			$internalStatusId = $requestData['internal_status_id'];
			if ($internalStatusId === 'none' || $internalStatusId === 'null') {
				$searchFilter .= " AND tasks.internal_status_id IS NULL";
			}else if (is_numeric($internalStatusId)) {
				$searchFilter .= $db->prepare(" AND tasks.internal_status_id = %d", (int)$internalStatusId);
			}
		}

		//date_type search
		if (isset($requestData['date_type']) && $requestData['date_type'] != '') {
			$dateType = $requestData['date_type'];
			if ($dateType == 'today') {
				$currentDate = gmdate('Y-m-d');
				$searchFilter .= $db->prepare(" AND DATE(tasks.end_date) = %s", $currentDate);
			} elseif ($dateType == 'next_seven_days') {
				$nextSevenDays = gmdate('Y-m-d', strtotime('+7 days'));
				$searchFilter .= $db->prepare(" AND tasks.end_date BETWEEN %s AND %s", gmdate('Y-m-d'), $nextSevenDays);
			} elseif ($dateType == 'upcoming') {
				$searchFilter .= $db->prepare(" AND tasks.end_date > %s", gmdate('Y-m-d'));
			} elseif ($dateType == 'overdue') {
				$searchFilter .= $db->prepare(" AND tasks.end_date < %s", gmdate('Y-m-d'));
			} elseif ($dateType == 'no-date') {
				$searchFilter .= " AND  tasks.end_date IS NULL";
			}
		}

		$limit = $requestData['limit'];
		$offset = $requestData['offset'];
		$limitPlusOne = $limit+1;

		//isVisibleGanttChart search

		if (isset($requestData['isVisibleGanttChart'])) {
			$isVisibleGanttChart = $requestData['isVisibleGanttChart'];
			if($isVisibleGanttChart == 'true'){
				$searchFilter .= " AND tasks.is_visible_on_gantt = 1";
			}
		}

		$parentResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder, tasks.privacy as taskPrivacy, 
       tasks.is_visible_on_gantt as ganttIsVisible, projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
       createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
       internal_status.id as statusId, internal_status.name as statusName, internal_status.color_code as status_color_code, internal_status.sort_order as status_sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
FROM {$wpdb->prefix}pms_tasks as tasks
    JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
    LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
    LEFT JOIN {$wpdb->prefix}pms_project_statuses as internal_status ON tasks.internal_status_id = internal_status.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
         WHERE tasks.deleted_at IS NULL AND tasks.parent_id IS NULL AND projects.id = %d {$searchFilter} AND tasks.status IN ('ACTIVE', 'COMPLETED') order by tasks.sort_order ASC LIMIT %d OFFSET %d", (int)$projectId, (int)$limitPlusOne, (int)$offset), ARRAY_A);

		// $hasMore = count($parentResults) > $limit;
		if (count($parentResults) > $limit) {
			$hasMore = true;
			$parentResults = array_slice($parentResults, 0, $limit);
		} else {
			$hasMore = false;
		}
		$taskSerialSettings = get_option('lazytask_serial_settings', []);
		$isSerialEnabled = isset($taskSerialSettings['enabled']) ? $taskSerialSettings['enabled'] : false;

		$returnArray = null;
		$returnArray['hasMore'] = $hasMore;
		if ($parentResults){

			$tasksId = array_column($parentResults, 'taskId');

			$taskTags = $this->getTaskTagsByTaskId($tasksId);

			$childTasks = [];
    		if (!empty($tasksId)) {
        		$inClause = implode(',', array_map('intval', $tasksId));
				$childResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder, tasks.privacy as taskPrivacy,
       tasks.is_visible_on_gantt as ganttIsVisible, projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
       createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
       internal_status.id as statusId, internal_status.name as statusName, internal_status.color_code as status_color_code, internal_status.sort_order as status_sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
FROM {$wpdb->prefix}pms_tasks as tasks
    JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
    LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
    LEFT JOIN {$wpdb->prefix}pms_project_statuses as internal_status ON tasks.internal_status_id = internal_status.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
         WHERE tasks.deleted_at IS NULL AND tasks.parent_id IN ($inClause) AND projects.id = %d {$searchFilter} AND tasks.status IN ('ACTIVE', 'COMPLETED') AND taskSections.mark_is_complete IN ('regular', 'complete') order by tasks.sort_order ASC", (int)$projectId), ARRAY_A);
			}

			$childArray = [];
			if($childResults){
				$childTaskIds = array_column($childResults, 'taskId');
    			$allTaskIds = array_merge($tasksId, $childTaskIds);
				$taskMembers = $this->getTaskMembers($allTaskIds);

				foreach ($childResults as $value) {
					$parentId = $value['parentId'];

					$assignedTo = null;
					if($value['assignedToId']){
						$assignedTo = [
							'id' => $value['assignedToId'],
							'name' => $value['assignedToName'],
							'email' => $value['assignedToEmail'],
							'username' => $value['assignedToUsername'],
							'created_at' => $value['assignedToCreatedAt'],
							'avatar' => Lazytask_UserController::getUserAvatar($value['assignedToId']),
						];
					}
					$priority = null;
					if($value['priorityId']){
						$priority = [
							'id' => $value['priorityId'],
							'name' => $value['priorityName'],
							'project_id' => $value['projectId'],
							'color_code' => $value['color_code'],
							'sort_order' => $value['sort_order'],
						];
					}

					$status = null;
					if($value['statusId']){
						$status = [
							'id' => $value['statusId'],
							'name' => $value['statusName'],
							'project_id' => $value['projectId'],
							'color_code' => $value['status_color_code'],
							'sort_order' => $value['status_sort_order'],
						];
					}

					$childArray[$parentId][] = [
						'id' => $value['taskId'],
						'createdBy_id' => $value['createdBy_id'],
						'createdBy_name' => $value['createdBy_name'],
						'task_section_id' => $value['sectionId'],
						'section_slug' => $value['sectionSlug'],
						'section_name' => trim($value['sectionName']),
						'name' => $value['taskName'],
						'slug' => $value['taskSlug'],
						'description' => $value['taskDescription'],
						'sort_order' => $value['sortOrder'],
						'assigned_to' => $assignedTo,
						'assignedTo_id' => $value['assignedToId'],
						'start_date'=> $value['start_date'],
						'end_date'=> $value['end_date'],
						'start_date_is_visible' => $value['start_date_is_visible']==1,
						'end_date_is_visible' => $value['end_date_is_visible']==1,
						'status'=> $value['taskStatus'],
						'priority_id'=> $value['priorityId'],
						'priority'=> $priority,
						'internal_status_id'=> $value['statusId'],
						'internal_status'=> $status,
						'project_id'=> $value['projectId'],
						'parent_id'=> $value['parentId'] ?: 0,
						'parent'=> [
							'id' => $value['taskParentId'],
							'name' => $value['taskParentName'],
							'slug' => $value['taskParentSlug'],
							'description' => $value['taskParentDescription']
						],
						'created_at'=> $value['taskCreatedAt'],
						'updated_at'=> $value['taskUpdatedAt'],
						'members' => isset($taskMembers[ $value['taskId'] ]) ? $taskMembers[ $value['taskId'] ] :[],
						'comments' => isset($taskComments[ $value['taskId'] ]) && sizeof($taskComments[ $value['taskId'] ]) > 0 ? $taskComments[ $value['taskId'] ] :[],
						'logActivities' => isset($taskActivityLogs[ $value['taskId'] ]) && sizeof($taskActivityLogs[ $value['taskId'] ]) > 0 ? $taskActivityLogs[ $value['taskId'] ] :[],
						'attachments' => isset($taskAttachments[ $value['taskId'] ]) && sizeof($taskAttachments[ $value['taskId'] ]) > 0 ? $taskAttachments[ $value['taskId'] ] :[],
						'tags' => isset($taskTags[ $value['taskId'] ]) && sizeof($taskTags[ $value['taskId'] ]) > 0 ? $taskTags[ $value['taskId'] ] :[],
						'ganttIsVisible' => (int)$value['ganttIsVisible'] ?? 0,
						'taskPrivacy' => $value['taskPrivacy'],
					];

					$returnArray['taskData'][$value['taskId']]= [
						'id' => $value['taskId'],
						'createdBy_id' => $value['createdBy_id'],
						'createdBy_name' => $value['createdBy_name'],
						'project_id'=> $value['projectId'],
						'task_section_id' => $value['sectionId'],
						'section_slug' => $value['sectionSlug'],
						'section_name' => trim($value['sectionName']),
						'name' => $value['taskName'],
						'slug' => $value['taskSlug'],
						'description' => $value['taskDescription'],
						'sort_order' => $value['sortOrder'],
						'assigned_to' => $assignedTo,
						'assignedTo_id' => $value['assignedToId'],
						'start_date'=> $value['start_date'],
						'end_date'=> $value['end_date'],
						'start_date_is_visible' => $value['start_date_is_visible']==1,
						'end_date_is_visible' => $value['end_date_is_visible']==1,
						'status'=> $value['taskStatus'],
						'priority_id'=> $value['priorityId'],
						'priority'=> $priority,
						'internal_status_id'=> $value['statusId'],
						'internal_status'=> $status,
						'parent_id'=> $value['parentId'] ?: 0,
						'parent'=> [
							'id' => $value['taskParentId'],
							'name' => $value['taskParentName'],
							'slug' => $value['taskParentSlug'],
							'description' => $value['taskParentDescription']
						],
						'created_at'=> $value['taskCreatedAt'],
						'updated_at'=> $value['taskUpdatedAt'],
						'members' => isset($taskMembers[ $value['taskId'] ]) ? $taskMembers[ $value['taskId'] ] :[],
						'comments' => isset($taskComments[ $value['taskId'] ]) && sizeof($taskComments[ $value['taskId'] ]) > 0 ? $taskComments[ $value['taskId'] ] :[],
						'logActivities' => isset($taskActivityLogs[ $value['taskId'] ]) && sizeof($taskActivityLogs[ $value['taskId'] ]) > 0 ? $taskActivityLogs[ $value['taskId'] ] :[],
						'attachments' => isset($taskAttachments[ $value['taskId'] ]) && sizeof($taskAttachments[ $value['taskId'] ]) > 0 ? $taskAttachments[ $value['taskId'] ] :[],
						'tags' => isset($taskTags[ $value['taskId'] ]) && sizeof($taskTags[ $value['taskId'] ]) > 0 ? $taskTags[ $value['taskId'] ] :[],
						'ganttIsVisible' => (int)$value['ganttIsVisible'] ?? 0,
						'taskPrivacy' => $value['taskPrivacy'],
					];
				}
			}

			
			foreach ( $parentResults as $key => $result ) {
				$groupKey = null;
				$groupName = null;
	
				switch ($groupBy) {
					case 'priority':
						$groupKey = $result['priorityId'] ?? 'no-priority';
						$groupName = 'priorityData';
						break;
					case 'status':
						$groupKey = $result['statusId'] ?? 'no-status';
						$groupName = 'statusData';
						break;
					case 'member':
						$groupKey = $result['assignedToId'] ?? 'no-assigned';
						$groupName = 'memberData';
						break;
					case 'duedate':
						$groupKey = $dateType;
						$groupName = 'dueDateData';
						break;
					default:
						$groupKey = $result['priorityId'] ?? 'no-priority';
						$groupName = 'priorityData';
						break;
				}

				$assignedTo = null;
				if($result['assignedToId']){
					$assignedTo = [
						'id' => $result['assignedToId'],
						'name' => $result['assignedToName'],
						'email' => $result['assignedToEmail'],
						'username' => $result['assignedToUsername'],
						'created_at' => $result['assignedToCreatedAt'],
						'avatar' => Lazytask_UserController::getUserAvatar($result['assignedToId']),
					];
				}
				$priority = null;
				if($result['priorityId']){
					$priority = [
						'id' => $result['priorityId'],
						'name' => $result['priorityName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['color_code'],
						'sort_order' => $result['sort_order'],
					];
				}
				
				$status = null;
				if($result['statusId']){
					$status = [
						'id' => $result['statusId'],
						'name' => $result['statusName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['status_color_code'],
						'sort_order' => $result['status_sort_order'],
					];
				}

				$returnArray[$groupName][$groupKey][] = [
					'id' => $result['taskId'],
					'createdBy_id' => $result['createdBy_id'],
					'createdBy_name' => $result['createdBy_name'],
					'project_id'=> $result['projectId'],
					'task_section_id' => $result['sectionId'],
					'section_slug' => $result['sectionSlug'],
					'section_name' => trim($result['sectionName']),
					'is_serial_enable' => $isSerialEnabled,
					'task_serial_no' => $result['taskSerialNo'],
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'sort_order' => $result['sortOrder'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible']==1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['statusId'],
					'internal_status'=> $status,
					'parent_id'=> $result['parentId'] ?: 0,
					'parent'=> null,
					'created_at'=> $result['taskCreatedAt'],
					'updated_at'=> $result['taskUpdatedAt'],
					'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
					'children' => isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[],
					'tags' => isset($taskTags[ $result['taskId'] ]) && sizeof($taskTags[ $result['taskId'] ]) > 0 ? $taskTags[ $result['taskId'] ] :[],
					'ganttIsVisible' => (int)$result['ganttIsVisible'] ?? 0,
					'taskPrivacy' => $result['taskPrivacy'],
				];

				$returnArray['taskData'][$result['taskId']]= [
					'id' => $result['taskId'],
					'createdBy_id' => $result['createdBy_id'],
					'createdBy_name' => $result['createdBy_name'],
					'project_id'=> $result['projectId'],
					'task_section_id' => $result['sectionId'],
					'section_slug' => $result['sectionSlug'],
					'section_name' => trim($result['sectionName']),
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'sort_order' => $result['sortOrder'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible']==1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['statusId'],
					'internal_status'=> $status,
					'parent_id'=> $result['parentId'] ?: 0,
					'parent'=> null,
					'created_at'=> $result['taskCreatedAt'],
					'updated_at'=> $result['taskUpdatedAt'],
					'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
					'children' => isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[],
					'tags' => isset($taskTags[ $result['taskId'] ]) && sizeof($taskTags[ $result['taskId'] ]) > 0 ? $taskTags[ $result['taskId'] ] :[],
					'ganttIsVisible' => (int)$result['ganttIsVisible'] ?? 0,
					'taskPrivacy' => $result['taskPrivacy'],
				];

				$returnArray['childData'][$result['taskSlug']] = isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[];
			}
		}
		return $returnArray;
	}

	public function getTasksByProjectId($projectId, $requestData)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		//search filter added by tasks name when search is not empty
		$searchFilter = '';
		if (isset($requestData['search']) && $requestData['search'] != '') {
			$search = '%' . $db->esc_like($requestData['search']) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}

		if (isset($requestData['name']) && $requestData['name'] != '') {
			$search = '%' . $db->esc_like($requestData['name']) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}
		if( isset($requestData['section_id']) && $requestData['section_id'] != '' ){
			$sectionId = $requestData['section_id'];
			$searchFilter .= $db->prepare(" AND tasks.section_id = %d", (int)$sectionId);
		}
		//assigned_to search
		if (isset($requestData['assigned_to']) && $requestData['assigned_to'] != '') {
			$assignedToId = $requestData['assigned_to'];
			$searchFilter .= $db->prepare(" AND tasks.assigned_to = %d", (int)$assignedToId);
		}
		//priority_id
		if (isset($requestData['priority_id']) && $requestData['priority_id'] != '') {
			$priorityId = $requestData['priority_id'];
			$searchFilter .= $db->prepare(" AND tasks.priority_id = %d", (int)$priorityId);
		}
		//internal_status_id
		if (isset($requestData['internal_status_id']) && $requestData['internal_status_id'] != '') {
			$internalStatusId = $requestData['internal_status_id'];
			$searchFilter .= $db->prepare(" AND tasks.internal_status_id = %d", (int)$internalStatusId);
		}

		//date_type search
		if (isset($requestData['date_type']) && $requestData['date_type'] != '') {
			$dateType = $requestData['date_type'];
			if ($dateType == 'today') {
				$currentDate = gmdate('Y-m-d');
				$searchFilter .= $db->prepare(" AND DATE(tasks.end_date) = %s", $currentDate);
			} elseif ($dateType == 'next_seven_days') {
				$nextSevenDays = gmdate('Y-m-d', strtotime('+7 days'));
				$searchFilter .= $db->prepare(" AND tasks.end_date BETWEEN %s AND %s", gmdate('Y-m-d'), $nextSevenDays);
			} elseif ($dateType == 'upcoming') {
				$searchFilter .= $db->prepare(" AND tasks.end_date > %s", gmdate('Y-m-d'));
			} elseif ($dateType == 'overdue') {
				$searchFilter .= $db->prepare(" AND tasks.end_date < %s", gmdate('Y-m-d'));
			} elseif ($dateType == 'no-date') {
				$searchFilter .= " AND  tasks.end_date IS NULL";
			}
		}



		//isVisibleGanttChart search

		if (isset($requestData['isVisibleGanttChart'])) {
			$isVisibleGanttChart = $requestData['isVisibleGanttChart'];
			if($isVisibleGanttChart == 'true'){
				$searchFilter .= " AND tasks.is_visible_on_gantt = 1";
			}
		}

		$allResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder, tasks.privacy as taskPrivacy,
       tasks.is_visible_on_gantt as ganttIsVisible, projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
       createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
       internal_status.id as statusId, internal_status.name as statusName, internal_status.color_code as status_color_code, internal_status.sort_order as status_sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
FROM {$wpdb->prefix}pms_tasks as tasks
    JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
    LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
    LEFT JOIN {$wpdb->prefix}pms_project_statuses as internal_status ON tasks.internal_status_id = internal_status.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
         WHERE tasks.deleted_at IS NULL AND projects.id = %d {$searchFilter} AND tasks.status IN ('ACTIVE', 'COMPLETED') AND taskSections.mark_is_complete IN ('regular', 'complete') order by tasks.sort_order ASC", (int)$projectId), ARRAY_A);

		$taskSerialSettings = get_option('lazytask_serial_settings', []);
		$isSerialEnabled = isset($taskSerialSettings['enabled']) ? $taskSerialSettings['enabled'] : false;

		$returnArray = null;
		if ($allResults){
			$parentResults = array_filter($allResults, function($item)  {
				return $item['parentId'] == '' && $item['parentId'] == null;
			});

			$tasksId = array_column($allResults, 'taskId');
			$taskMembers = $this->getTaskMembers($tasksId);

			$taskComments = $this->getCommentsByTaskId($tasksId, 'task');

			$taskActivityLogs = $this->getActivityLogsByTaskId($tasksId, 'task');

			$taskAttachments = $this->getAttachmentsByTaskId($tasksId, 'task');

			$taskTags = $this->getTaskTagsByTaskId($tasksId);

			$childResults = array_filter($allResults, function($item)  {
				return $item['parentId'] != '' && $item['parentId'] != null;
			});

			$childArray = [];
			if($childResults){
				foreach ($childResults as $value) {
					$parentId = $value['parentId'];

					$assignedTo = null;
					if($value['assignedToId']){
						$assignedTo = [
							'id' => $value['assignedToId'],
							'name' => $value['assignedToName'],
							'email' => $value['assignedToEmail'],
							'username' => $value['assignedToUsername'],
							'created_at' => $value['assignedToCreatedAt'],
							'avatar' => Lazytask_UserController::getUserAvatar($value['assignedToId']),
						];
					}
					$priority = null;
					if($value['priorityId']){
						$priority = [
							'id' => $value['priorityId'],
							'name' => $value['priorityName'],
							'project_id' => $value['projectId'],
							'color_code' => $value['color_code'],
							'sort_order' => $value['sort_order'],
						];
					}

					$status = null;
					if($value['statusId']){
						$status = [
							'id' => $value['statusId'],
							'name' => $value['statusName'],
							'project_id' => $value['projectId'],
							'color_code' => $value['status_color_code'],
							'sort_order' => $value['status_sort_order'],
						];
					}

					$childArray[$parentId][] = [
						'id' => $value['taskId'],
						'createdBy_id' => $value['createdBy_id'],
						'createdBy_name' => $value['createdBy_name'],
						'task_section_id' => $value['sectionId'],
						'section_slug' => $value['sectionSlug'],
						'section_name' => trim($value['sectionName']),
						'name' => $value['taskName'],
						'slug' => $value['taskSlug'],
						'description' => $value['taskDescription'],
						'sort_order' => $value['sortOrder'],
						'assigned_to' => $assignedTo,
						'assignedTo_id' => $value['assignedToId'],
						'start_date'=> $value['start_date'],
						'end_date'=> $value['end_date'],
						'start_date_is_visible' => $value['start_date_is_visible']==1,
						'end_date_is_visible' => $value['end_date_is_visible']==1,
						'status'=> $value['taskStatus'],
						'priority_id'=> $value['priorityId'],
						'priority'=> $priority,
						'internal_status_id'=> $value['statusId'],
						'internal_status'=> $status,
						'project_id'=> $value['projectId'],
						'parent_id'=> $value['parentId'] ?: 0,
						'parent'=> [
							'id' => $value['taskParentId'],
							'name' => $value['taskParentName'],
							'slug' => $value['taskParentSlug'],
							'description' => $value['taskParentDescription']
						],
						'created_at'=> $value['taskCreatedAt'],
						'updated_at'=> $value['taskUpdatedAt'],
						'members' => isset($taskMembers[ $value['taskId'] ]) ? $taskMembers[ $value['taskId'] ] :[],
						'comments' => isset($taskComments[ $value['taskId'] ]) && sizeof($taskComments[ $value['taskId'] ]) > 0 ? $taskComments[ $value['taskId'] ] :[],
						'logActivities' => isset($taskActivityLogs[ $value['taskId'] ]) && sizeof($taskActivityLogs[ $value['taskId'] ]) > 0 ? $taskActivityLogs[ $value['taskId'] ] :[],
						'attachments' => isset($taskAttachments[ $value['taskId'] ]) && sizeof($taskAttachments[ $value['taskId'] ]) > 0 ? $taskAttachments[ $value['taskId'] ] :[],
						'tags' => isset($taskTags[ $value['taskId'] ]) && sizeof($taskTags[ $value['taskId'] ]) > 0 ? $taskTags[ $value['taskId'] ] :[],
						'ganttIsVisible' => (int)$value['ganttIsVisible'] ?? 0,
						'taskPrivacy' => $value['taskPrivacy'],
					];

					$returnArray['taskData'][$value['taskId']]= [
						'id' => $value['taskId'],
						'createdBy_id' => $value['createdBy_id'],
						'createdBy_name' => $value['createdBy_name'],
						'project_id'=> $value['projectId'],
						'task_section_id' => $value['sectionId'],
						'section_slug' => $value['sectionSlug'],
						'section_name' => trim($value['sectionName']),
						'name' => $value['taskName'],
						'slug' => $value['taskSlug'],
						'description' => $value['taskDescription'],
						'sort_order' => $value['sortOrder'],
						'assigned_to' => $assignedTo,
						'assignedTo_id' => $value['assignedToId'],
						'start_date'=> $value['start_date'],
						'end_date'=> $value['end_date'],
						'start_date_is_visible' => $value['start_date_is_visible']==1,
						'end_date_is_visible' => $value['end_date_is_visible']==1,
						'status'=> $value['taskStatus'],
						'priority_id'=> $value['priorityId'],
						'priority'=> $priority,
						'internal_status_id'=> $value['statusId'],
						'internal_status'=> $status,
						'parent_id'=> $value['parentId'] ?: 0,
						'parent'=> [
							'id' => $value['taskParentId'],
							'name' => $value['taskParentName'],
							'slug' => $value['taskParentSlug'],
							'description' => $value['taskParentDescription']
						],
						'created_at'=> $value['taskCreatedAt'],
						'updated_at'=> $value['taskUpdatedAt'],
						'members' => isset($taskMembers[ $value['taskId'] ]) ? $taskMembers[ $value['taskId'] ] :[],
						'comments' => isset($taskComments[ $value['taskId'] ]) && sizeof($taskComments[ $value['taskId'] ]) > 0 ? $taskComments[ $value['taskId'] ] :[],
						'logActivities' => isset($taskActivityLogs[ $value['taskId'] ]) && sizeof($taskActivityLogs[ $value['taskId'] ]) > 0 ? $taskActivityLogs[ $value['taskId'] ] :[],
						'attachments' => isset($taskAttachments[ $value['taskId'] ]) && sizeof($taskAttachments[ $value['taskId'] ]) > 0 ? $taskAttachments[ $value['taskId'] ] :[],
						'tags' => isset($taskTags[ $value['taskId'] ]) && sizeof($taskTags[ $value['taskId'] ]) > 0 ? $taskTags[ $value['taskId'] ] :[],
						'ganttIsVisible' => (int)$value['ganttIsVisible'] ?? 0,
						'taskPrivacy' => $value['taskPrivacy'],
					];
				}
			}

			foreach ( $parentResults as $key => $result ) {

				$assignedTo = null;
				if($result['assignedToId']){
					$assignedTo = [
						'id' => $result['assignedToId'],
						'name' => $result['assignedToName'],
						'email' => $result['assignedToEmail'],
						'username' => $result['assignedToUsername'],
						'created_at' => $result['assignedToCreatedAt'],
						'avatar' => Lazytask_UserController::getUserAvatar($result['assignedToId']),
					];
				}
				$priority = null;
				if($result['priorityId']){
					$priority = [
						'id' => $result['priorityId'],
						'name' => $result['priorityName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['color_code'],
						'sort_order' => $result['sort_order'],
					];
				}
				
				$status = null;
				if($result['statusId']){
					$status = [
						'id' => $result['statusId'],
						'name' => $result['statusName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['status_color_code'],
						'sort_order' => $result['status_sort_order'],
					];
				}

				$returnArray['sectionData'][$result['sectionSlug']][] = [
					'id' => $result['taskId'],
					'createdBy_id' => $result['createdBy_id'],
					'createdBy_name' => $result['createdBy_name'],
					'project_id'=> $result['projectId'],
					'task_section_id' => $result['sectionId'],
					'section_slug' => $result['sectionSlug'],
					'section_name' => trim($result['sectionName']),
					'is_serial_enable' => $isSerialEnabled,
					'task_serial_no' => $result['taskSerialNo'],
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'sort_order' => $result['sortOrder'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible']==1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['statusId'],
					'internal_status'=> $status,
					'parent_id'=> $result['parentId'] ?: 0,
					'parent'=> null,
					'created_at'=> $result['taskCreatedAt'],
					'updated_at'=> $result['taskUpdatedAt'],
					'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
					'children' => isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[],
					'comments' => isset($taskComments[ $result['taskId'] ]) && sizeof($taskComments[ $result['taskId'] ]) > 0 ? $taskComments[ $result['taskId'] ] :[],
					'logActivities' => isset($taskActivityLogs[ $result['taskId'] ]) && sizeof($taskActivityLogs[ $result['taskId'] ]) > 0 ? $taskActivityLogs[ $result['taskId'] ] :[],
					'attachments' => isset($taskAttachments[ $result['taskId'] ]) && sizeof($taskAttachments[ $result['taskId'] ]) > 0 ? $taskAttachments[ $result['taskId'] ] :[],
					'tags' => isset($taskTags[ $result['taskId'] ]) && sizeof($taskTags[ $result['taskId'] ]) > 0 ? $taskTags[ $result['taskId'] ] :[],
					'ganttIsVisible' => (int)$result['ganttIsVisible'] ?? 0,
					'taskPrivacy' => $result['taskPrivacy'],
				];

				$returnArray['taskData'][$result['taskId']]= [
					'id' => $result['taskId'],
					'createdBy_id' => $result['createdBy_id'],
					'createdBy_name' => $result['createdBy_name'],
					'project_id'=> $result['projectId'],
					'task_section_id' => $result['sectionId'],
					'section_slug' => $result['sectionSlug'],
					'section_name' => trim($result['sectionName']),
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'sort_order' => $result['sortOrder'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible']==1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['statusId'],
					'internal_status'=> $status,
					'parent_id'=> $result['parentId'] ?: 0,
					'parent'=> null,
					'created_at'=> $result['taskCreatedAt'],
					'updated_at'=> $result['taskUpdatedAt'],
					'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
					'children' => isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[],
					'comments' => isset($taskComments[ $result['taskId'] ]) && sizeof($taskComments[ $result['taskId'] ]) > 0 ? $taskComments[ $result['taskId'] ] :[],
					'logActivities' => isset($taskActivityLogs[ $result['taskId'] ]) && sizeof($taskActivityLogs[ $result['taskId'] ]) > 0 ? $taskActivityLogs[ $result['taskId'] ] :[],
					'attachments' => isset($taskAttachments[ $result['taskId'] ]) && sizeof($taskAttachments[ $result['taskId'] ]) > 0 ? $taskAttachments[ $result['taskId'] ] :[],
					'tags' => isset($taskTags[ $result['taskId'] ]) && sizeof($taskTags[ $result['taskId'] ]) > 0 ? $taskTags[ $result['taskId'] ] :[],
					'ganttIsVisible' => (int)$result['ganttIsVisible'] ?? 0,
					'taskPrivacy' => $result['taskPrivacy'],
				];

				$returnArray['childData'][$result['taskSlug']] = isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[];
			}
		}
		return $returnArray;
	}

	public function getTaskSectionsByProjectId($projectId)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$taskSectionsTable = LAZYTASK_TABLE_PREFIX . 'task_sections';
		$results = $db->get_results($db->prepare("SELECT * FROM {$wpdb->prefix}pms_task_sections WHERE project_id = %d order by sort_order ASC", (int)$projectId), ARRAY_A);
		$arrayReturn = [];
		if ($results){
			foreach ( $results as $result ) {
				$arrayReturn[$result['slug']] = [
					'id' => $result['id'],
					'name' => $result['name'],
					'slug' => $result['slug'],
					'sort_order' => $result['sort_order'],
					'mark_is_complete' => $result['mark_is_complete'],
				];
			}
		}

		return $arrayReturn;
	}


	private function getTaskMembers($tasksId)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$usersTable = $wpdb->prefix . 'users';
		$taskMembersTable = self::TABLE_TASK_MEMBERS;

		// if (empty($tasksId)) {
		// 	return [];
		// }

		if (is_array($tasksId)) {
			$ids = implode(', ', array_fill(0, count($tasksId), '%s'));
		}else{
			$ids = '%s';
			$tasksId = [$tasksId];
		}

		$sql = "SELECT * FROM `{$wpdb->prefix}users` as users
			JOIN `{$wpdb->prefix}pms_task_members` as taskMembers  ON users.ID = taskMembers.user_id 
		WHERE taskMembers.task_id IN ($ids)";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $tasksId));

		$results = $db->get_results(
			$query, ARRAY_A);

		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				$returnArray[$value['task_id']][] = [
					'id' => $value['ID'],
					'name' => $value['display_name'],
					'email' => $value['user_email'],
					'username' => $value['user_login'],
					'created_at' => $value['user_registered'],
					'avatar' => Lazytask_UserController::getUserAvatar($value['ID']),
				];
			}
		}
		return $returnArray;
	}

	public function show(WP_REST_Request $request)
	{

		$taskId = $request->get_param('id');

		$task = $this->getTaskById($taskId);

		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Project show successfully', 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}
		return new WP_Error('not_found', 'Task not found.', array('status' => 404));

	}

	public function delete(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$taskId = $request->get_param('id');
		$requestData = $request->get_json_params();

		$type = isset($requestData['type']) && $requestData['type'] ? $requestData['type']:'task';
		$deleted_at = current_time('mysql');
		$deleted_by = isset($requestData['deleted_by']) && $requestData['deleted_by'] != "" ? (int)$requestData['deleted_by'] : null;

		$tableTasks = LAZYTASK_TABLE_PREFIX . 'tasks';
		// task soft delete by task id
		$db->query('START TRANSACTION');
		$taskDeleted = $db->update(
			$tableTasks,
			array(
				"deleted_at" => $deleted_at,
				"deleted_by" => $deleted_by,
			),
			array( 'id' => $taskId )
		);

		if (!$taskDeleted) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_Error('db_update_error', 'Could not delete task in the database.', array('status' => 500));
		}
		// activity log for task delete
		$properties['attributes'] = [
			'deleted_by' => $deleted_by,
			'deleted_at' => $deleted_at,
			'type' => $type, // 'task' or 'sub-task'
			'status' => 0,
		];
		$activityLogArg = [
			"user_id" => $deleted_by,
			"subject_id" => $taskId,
			"subject_name" => 'task',
			"subject_type" => $type,
			"event" => 'deleted',
			"properties" => wp_json_encode($properties),
			"created_at" => $deleted_at,
		];
		$activitiesLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
		$db->insert($activitiesLogTable, $activityLogArg);

		// Commit the transaction
		$db->query('COMMIT');

		$task = $this->getTaskById($taskId);

		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task deleted successfully', 'data'=>$task, 'task'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}
		return new WP_Error('not_found', 'Task not found.', array('status' => 404));

	}

	public function ganttTasksDelete(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$taskId = $request->get_param('id');
		$requestData = $request->get_json_params();

		$deleted_at = current_time('mysql');
		$deleted_by = isset($requestData['deleted_by']) && $requestData['deleted_by'] != "" ? (int)$requestData['deleted_by'] : null;

		$tableTasks = LAZYTASK_TABLE_PREFIX . 'tasks_for_gantt';

		$taskDeleted = $db->update(
			$tableTasks,
			[ 'deleted_at' => $deleted_at, 'is_visible' => 0 ],
			[ 'task_id' => $taskId ]
		);

		$task = $this->getTaskById($taskId);

		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task deleted successfully', 'task'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}
	}

	public function getTaskById($taskId)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		if($taskId == ''){
			return [];
		}

		$result = $db->get_row($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.privacy as taskPrivacy, 
       tasks.is_visible_on_gantt as ganttIsVisible, projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
       createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
       internal_status.id as statusId, internal_status.name as statusName, internal_status.slug as statusSlug, internal_status.color_code as status_color_code, internal_status.sort_order as status_sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt,
	   parentTaskSections.id as parentTaskSectionId, parentTaskSections.name as parentTaskSectionName, parentTaskSections.slug as parentTaskSectionSlug
	FROM {$wpdb->prefix}pms_tasks as tasks
    JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
    LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
    LEFT JOIN {$wpdb->prefix}pms_project_statuses as internal_status ON tasks.internal_status_id = internal_status.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
	LEFT JOIN {$wpdb->prefix}pms_task_sections as parentTaskSections ON taskParent.section_id = parentTaskSections.id
         WHERE tasks.id = %d LIMIT 1", $taskId), ARRAY_A);
		$returnArray = [];

		$taskSerialSettings = get_option('lazytask_serial_settings', []);
		$isSerialEnabled = isset($taskSerialSettings['enabled']) ? $taskSerialSettings['enabled'] : false;

		if($result){
			$taskMembers = $this->getTaskMembers($taskId);
			$subTasks = $this->getSubTasksByTaskId($taskId);

			$taskComments = $this->getCommentsByTaskId($taskId, 'task');

			$taskActivityLogs = $this->getActivityLogsByTaskId($taskId, 'task');

			$taskAttachments = $this->getAttachmentsByTaskId($taskId, 'task');

			$taskTags = $this->getTaskTagsByTaskId($taskId);

			$projectObj = new Lazytask_ProjectController();

			$project = $projectObj->getProjectById($result['projectId']);

			$parent = null;
			if($result['taskParentId']){
				$parent = [
					'id' => $result['taskParentId'],
					'name' => $result['taskParentName'],
					'slug' => $result['taskParentSlug'],
					'description' => $result['taskParentDescription'],
					'task_section_id' => $result['parentTaskSectionId'],
					'section_name' => trim($result['parentTaskSectionName']),
					'section_slug' => $result['parentTaskSectionSlug'],
				];
			}
			$assignedTo = null;
			if($result['assignedToId']){
				$assignedTo = [
					'id' => $result['assignedToId'],
					'name' => $result['assignedToName'],
					'email' => $result['assignedToEmail'],
					'username' => $result['assignedToUsername'],
					'created_at' => $result['assignedToCreatedAt'],
					'avatar' => Lazytask_UserController::getUserAvatar($result['assignedToId']),
				];
			}
			$priority = null;
			if($result['priorityId']){
				$priority = [
					'id' => $result['priorityId'],
					'name' => $result['priorityName'],
					'project_id' => $result['projectId'],
					'color_code' => $result['color_code'],
					'sort_order' => $result['sort_order'],
				];
			}
			
			$status = null;
			if($result['statusId']){
				$status = [
					'id' => $result['statusId'],
					'name' => $result['statusName'],
					'slug' => $result['statusSlug'],
					'project_id' => $result['projectId'],
					'color_code' => $result['status_color_code'],
					'sort_order' => $result['status_sort_order'],
				];
			}

			$comments = isset($taskComments[ $result['taskId'] ]) && sizeof($taskComments[ $result['taskId'] ]) > 0 ? $taskComments[ $result['taskId'] ] :[];
			$logActivities = isset($taskActivityLogs[ $result['taskId'] ]) && sizeof($taskActivityLogs[ $result['taskId'] ]) > 0 ? $taskActivityLogs[ $result['taskId'] ] :[];
			$commentsAndLogActivities = $this->mergeTaskCommentsAndLogActivities($comments, $logActivities);

			$returnArray = [
				'id' => $result['taskId'],
				'createdBy_id' => $result['createdBy_id'],
				'createdBy_name' => $result['createdBy_name'],
				'project_id' => $result['projectId'],
				'project' => $project,
				'task_section_id' => $result['sectionId'],
				'section_slug' => $result['sectionSlug'],
				'section_name' => trim($result['sectionName']),
				'is_serial_enable' => $isSerialEnabled,
				'task_serial_no' => $result['taskSerialNo'],
				'name' => $result['taskName'],
				'slug' => $result['taskSlug'],
				'description' => $result['taskDescription'],
				'assignedTo_id' => $result['assignedToId'],
				'assigned_to' => $assignedTo,
				'start_date'=> $result['start_date'],
				'end_date'=> $result['end_date'],
				'start_date_is_visible' => $result['start_date_is_visible']==1,
				'end_date_is_visible' => $result['end_date_is_visible']==1,
				'status'=> $result['taskStatus'],
				'priority_id'=> $result['priorityId'],
				'priority'=> $priority,
				'internal_status_id'=> $result['statusId'],
				'internal_status'=> $status,
				'parent_id'=> $result['parentId'] ?: 0,
				'parent'=>$parent,
				'created_at'=> $result['taskCreatedAt'],
				'updated_at'=> $result['taskUpdatedAt'],
				'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
				'children' => isset($subTasks[ $result['taskId'] ]['child']) ? $subTasks[ $result['taskId'] ]['child'] :[],
				'comments' => $comments,
				'logActivities' => $logActivities,
				'attachments' => isset($taskAttachments[ $result['taskId'] ]) && sizeof($taskAttachments[ $result['taskId'] ]) > 0 ? $taskAttachments[ $result['taskId'] ] :[],
				'tags' => isset($taskTags[ $result['taskId'] ]) && sizeof($taskTags[ $result['taskId'] ]) > 0 ? $taskTags[ $result['taskId'] ] :[],
				'commentsAndLogActivities' => $commentsAndLogActivities,
				'ganttIsVisible' => (int)$result['ganttIsVisible'] ?? 0,
				'taskPrivacy' => $result['taskPrivacy'],
			];
			list( $start, $end, $isMissing, $durationDay ) = $this->ganttChartStartDateEndDate($result['start_date'], $result['end_date']);
			$returnArray['type'] = $result['parentId'] ? 'task':'project';
			$returnArray['start'] = $start;
			$returnArray['end'] = $end;
			$returnArray['isMissingDates'] = $isMissing;
			$returnArray['duration'] = $durationDay;

		}
		return $returnArray;
	}

	private function getSubTasksByTaskId($taskId)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$sql = "SELECT tasks.id as taskId, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, 
	   tasks.is_visible_on_gantt as ganttIsVisible, projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
	   taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
	   createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
	   assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
	   priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
	   internalStatus.id as internalStatusId, internalStatus.name as internalStatusName, internalStatus.color_code as color_code, internalStatus.sort_order as sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt,
	   parentTaskSections.id as parentTaskSectionId, parentTaskSections.name as parentTaskSectionName, parentTaskSections.slug as parentTaskSectionSlug
	FROM {$wpdb->prefix}pms_tasks as tasks
	JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
	JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
	LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
	LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
	LEFT JOIN {$wpdb->prefix}pms_project_statuses as internalStatus ON tasks.internal_status_id = internalStatus.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
	LEFT JOIN {$wpdb->prefix}pms_task_sections as parentTaskSections ON taskParent.section_id = parentTaskSections.id
	 WHERE tasks.parent_id IS NOT NULL AND tasks.deleted_at IS NULL AND tasks.parent_id = %d";
		$results = $db->get_results($db->prepare($sql, $taskId), ARRAY_A);
		$returnArray = [];
		if ($results){

			$tasksId = array_column($results, 'taskId');
			$taskMembers = $this->getTaskMembers($tasksId);

			foreach ($results as $result) {
				$parentId = $result['parentId'];
				$assignedTo = null;
				if($result['assignedToId']){
					$assignedTo = [
						'id' => $result['assignedToId'],
						'name' => $result['assignedToName'],
						'email' => $result['assignedToEmail'],
						'username' => $result['assignedToUsername'],
						'created_at' => $result['assignedToCreatedAt'],
						'avatar' => Lazytask_UserController::getUserAvatar($result['assignedToId']),
					];
				}

				$priority = null;
				if($result['priorityId']){
					$priority = [
						'id' => $result['priorityId'],
						'name' => $result['priorityName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['color_code'],
						'sort_order' => $result['sort_order'],
					];
				}
				
				$internal_status = null;
				if($result['internalStatusId']){
					$internal_status = [
						'id' => $result['internalStatusId'],
						'name' => $result['internalStatusName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['color_code'],
						'sort_order' => $result['sort_order'],
					];
				}


				$returnArray[$parentId]['child'][] = [
					'id' => $result['taskId'],
					'createdBy_id' => $result['createdBy_id'],
					'createdBy_name' => $result['createdBy_name'],
					'project_id' => $result['projectId'],
					'task_section_id' => $result['sectionId'],
					'section_name' => trim($result['sectionName']),
					'section_slug' => $result['sectionSlug'],
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible']==1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['internalStatusId'],
					'internal_status'=> $internal_status,
					'parent_id'=> $result['parentId'] ?: 0,
					'parent'=> [
						'id' => $result['taskParentId'],
						'name' => $result['taskParentName'],
						'slug' => $result['taskParentSlug'],
						'description' => $result['taskParentDescription'],
						'task_section_id' => $result['parentTaskSectionId'],
						'section_name' => trim($result['parentTaskSectionName']),
						'section_slug' => $result['parentTaskSectionSlug'],
					],
					'created_at'=> $result['taskCreatedAt'],
					'updated_at'=> $result['taskUpdatedAt'],
					'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
					'ganttIsVisible' => (int)$result['ganttIsVisible'] ?? 0,
				];

				list( $start, $end, $isMissing, $durationDay ) = $this->ganttChartStartDateEndDate($result['start_date'], $result['end_date']);
				$returnArray['type'] = $result['parentId'] ? 'task':'project';
				$returnArray['start'] = $start;
				$returnArray['end'] = $end;
				$returnArray['isMissingDates'] = $isMissing;
				$returnArray['duration'] = $durationDay;

			}

		}
		return $returnArray;
	}

	public function getParentTaskBySlug($slug, $projectId)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$tableTask = LAZYTASK_TABLE_PREFIX . 'tasks';
		$tableProjects = LAZYTASK_TABLE_PREFIX . 'projects';

		$task = $db->get_row($db->prepare("SELECT task.id, task.name, task.slug, task.sort_order, task.section_id, projects.name as project_name, projects.id as project_id FROM `{$wpdb->prefix}pms_tasks` as task
		 JOIN `{$wpdb->prefix}pms_projects` as projects ON task.project_id = projects.id
		 WHERE task.slug = %s and projects.id=%d", $slug, $projectId), ARRAY_A);

		if($task){
			return $task;
		}

		return null;

	}


	public function createTaskSection(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$name = sanitize_text_field($requestData['name']);
		$projectId = $requestData['project_id'];

		$submittedData = [];
		$submittedData['name'] = sanitize_text_field($requestData['name']);
		$submittedData['project_id'] = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;
		$submittedData['sort_order'] = isset($requestData['sort_order']) && $requestData['sort_order'] != "" ? (int)$requestData['sort_order'] : 999;
		$submittedData['created_at'] = current_time('mysql');
		$submittedData['updated_at'] = current_time('mysql');
		$submittedData['created_by'] = isset($requestData['created_by']) && $requestData['created_by'] != "" ? (int)$requestData['created_by'] : null;


		$tableTaskSection = LAZYTASK_TABLE_PREFIX . 'task_sections';

		// generate uuid
		$generateUUID = wp_generate_uuid4();
		$slug = Lazytask_SlugGenerator::slug( $generateUUID, $tableTaskSection, 'slug' );
		$submittedData['slug'] = $slug;

		if($name == ''){
			return new WP_Error('required_fields', 'Please enter name.', array('status' => 400));
		}
		if($projectId == ''){
			return new WP_Error('required_fields', 'Please select project.', array('status' => 400));
		}

		$db->insert($tableTaskSection, $submittedData);
		$taskSectionId = $wpdb->insert_id;
		$taskSection = $this->getTaskSectionById($taskSectionId);
		if($taskSection){
			$returnArray['taskSections'] = $taskSection['slug'];
			$returnArray['tasks'][$taskSection['slug']] = [];
			$returnArray['taskListSectionsName'][$taskSection['slug']] = ['id'=> $taskSection['id'], 'name' => $taskSection['name'], 'slug' => $taskSection['slug'], 'sort_order' => $taskSection['sort_order'], 'mark_is_complete' => $taskSection['mark_is_complete'] ] ;
			return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $returnArray], 200);
		}

	}

	public function updateTaskSection(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$id = $request->get_param('id');
		$name = sanitize_text_field($requestData['name']);
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$tableTaskSection = LAZYTASK_TABLE_PREFIX . 'task_sections';

		$db->query('START TRANSACTION');

		$taskSectionUpdated = $db->update(
			$tableTaskSection,
			array(
				"name" => $name,
				"updated_at" => $updated_at,
				"updated_by" => $updated_by,
			),
			array( 'id' => $id )
		);

		// Check if the task was updated successfully
		if (!$taskSectionUpdated) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_Error('db_update_error', 'Could not update task section in the database.', array('status' => 500));
		}

		$db->query('COMMIT');

		$taskSection = $this->getTaskSectionById($id);
		if($taskSection){
			$returnArray['taskSections'] = $taskSection['slug'];
			$returnArray['taskListSectionsName'][$taskSection['slug']] = ['id'=> $taskSection['id'], 'name' => $taskSection['name'], 'slug' => $taskSection['slug'], 'sort_order' => $taskSection['sort_order'], 'mark_is_complete' => $taskSection['mark_is_complete'] ] ;
			return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $returnArray], 200);
		}
		return new WP_Error('not_found', 'Task section not found.', array('status' => 404));
	}

	public function markIsCompleteTaskSection(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$id = $request->get_param('id');
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$project_id = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;

		$markIsChecked = isset($requestData['markIsChecked']) && $requestData['markIsChecked'] ? 'complete' : 'regular';

		$tableTaskSection = LAZYTASK_TABLE_PREFIX . 'task_sections';

		$db->query('START TRANSACTION');

		$exitCheckMarkIsComplete = $db->get_row(
			$db->prepare(
				"SELECT * 
				FROM {$tableTaskSection} 
				WHERE mark_is_complete = %s 
				AND id != %d 
				AND project_id = %d 
				AND deleted_at IS NULL",
				'complete',
				$id,
				$project_id
			)
		);
		if($exitCheckMarkIsComplete){
			//already exits
			return new WP_REST_Response(['status'=>409, 'message' => 'Already mark is complete available', 'data' =>[]]);
			}


		$taskSectionUpdated = $db->update(
			$tableTaskSection,
			array(
				"mark_is_complete" => $markIsChecked,
				"updated_at" => $updated_at,
				"updated_by" => $updated_by,
			),
			array( 'id' => $id, 'project_id' => $project_id )
		);

		// Check if the task was updated successfully
		if (!$taskSectionUpdated) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_REST_Response(['status'=>500, 'message' => 'Could not update task section in the database']);
		}

		//task status update by section mark is complete
		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
		$db->update(
			$taskTable,
			array(
				"status" => $markIsChecked=='complete' ? 'COMPLETED' : 'ACTIVE',
				"updated_at" => $updated_at,
				"updated_by" => $updated_by,
			),
			array( 'section_id' => $id, 'project_id'=> $project_id )
		);

		$db->query('COMMIT');

		$taskSection = $this->getTaskSectionById($id);
		if($taskSection){
			$returnArray['taskSections'] = $taskSection['slug'];
			$returnArray['taskListSectionsName'][$taskSection['slug']] = ['id'=> $taskSection['id'], 'name' => $taskSection['name'], 'slug' => $taskSection['slug'], 'sort_order' => $taskSection['sort_order'] , 'mark_is_complete' => $taskSection['mark_is_complete'] ] ;
			$returnArray['section'] = ['id'=> $taskSection['id'], 'name' => $taskSection['name'], 'slug' => $taskSection['slug'], 'sort_order' => $taskSection['sort_order'], 'mark_is_complete' => $taskSection['mark_is_complete'] ] ;
			return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $returnArray], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message' => 'Task section not found.']);
	}

	public function archiveTaskSection(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		
		$id = $request->get_param('id');
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$project_id = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;
		
		$task_id = isset($requestData['task_id']) && $requestData['task_id'] != "" ? (int)$requestData['task_id'] : null;

		$archiveSection = isset($requestData['archive_section']) && $requestData['archive_section'] === true;

		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';

		if($id && $archiveSection){
			$sectionTable = LAZYTASK_TABLE_PREFIX . 'task_sections';
			$section_query = $db->get_row(
				$db->prepare(
					"SELECT id, mark_is_complete FROM {$sectionTable} 
					WHERE deleted_at IS NULL
					AND id = %d",
					$id
				)
			);
			$archived_status = '';
			if ($section_query) {
				// if ($section_query->mark_is_complete === 'regular') {
				// 	$archived_status = 'ARCHIVED_R';
				// } elseif ($section_query->mark_is_complete === 'complete') {
				// 	$archived_status = 'ARCHIVED_C';
				// }
				$archived_status = 'ARCHIVED_R';
			} else {
				return new WP_REST_Response(['status'=>404, 'message' => 'Section not found.']);
			}

			$db->update(
				$sectionTable,
				array(
					'mark_is_complete' => $archived_status,
					'updated_at' => $updated_at,
					'updated_by' => $updated_by,
				),
				array('id' => $id)
			);

			return new WP_REST_Response(['status'=>200, 'message'=>'Section Archived successfully'], 200);
		}elseif($task_id){
			$task_query = $db->get_row(
				$db->prepare(
					"SELECT id, status FROM {$taskTable} 
					WHERE deleted_at IS NULL 
					AND parent_id IS NULL 
					AND id = %d",
					$task_id
				)
			);
			if ($task_query) {
				if ($task_query->status === 'ACTIVE') {
					$archived_status = 'ARCHIVED_A';
				} elseif ($task_query->status === 'COMPLETED') {
					$archived_status = 'ARCHIVED_C';
				}
			} else {
				return new WP_REST_Response(['status'=>404, 'message' => 'Task not found.']);
			}

			// update the task status
			$db->update(
				$taskTable,
				array(
					'status' => $archived_status,
					'updated_at' => $updated_at,
					'updated_by' => $updated_by,
				),
				array('id' => $task_id)
			);

			// Archive all subtasks
			$db->query(
				$db->prepare(
					"UPDATE {$taskTable} 
					SET status = %s, updated_at = %s, updated_by = %s 
					WHERE deleted_at IS NULL AND parent_id = %d",
					$archived_status, $updated_at, $updated_by, $task_id
				)
			);

			$task = $this->getTaskById($task_id);

			if($task){
				$column[$task['section_slug']] = $task;
				$myTaskColumn = [];
				$currentDate = gmdate('Y-m-d');
				$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
				$myTaskColumn['all'] = $task;
				if($task['end_date'] < $currentDate){
					$task['my_task_section'] = 'overdue';
					$myTaskColumn['overdue'] = $task;
				}elseif($task['end_date'] == $currentDate){
					$task['my_task_section'] = 'today';
					$myTaskColumn['today'] = $task;
				}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
					$task['my_task_section'] = 'nextSevenDays';
					$myTaskColumn['nextSevenDays'] = $task;
				}else{
					$task['my_task_section'] = 'upcoming';
					$myTaskColumn['upcoming'] = $task;
				}
				return new WP_REST_Response(['status'=>200, 'message'=>'Task Archived successfully', 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
			}

		}else{

			//task status update by section mark is complete
			$tasks = $db->get_results(
				$db->prepare(
					"SELECT id, status FROM {$taskTable} 
					WHERE deleted_at IS NULL 
					AND parent_id IS NULL 
					AND section_id = %d 
					AND project_id = %d",
					$id,
					$project_id
				)
			);
							
			// Update each task with conditional status
			foreach ($tasks as $task) {
				$archived_status = '';

				if ($task->status === 'ACTIVE') {
					$archived_status = 'ARCHIVED_A';
				} elseif ($task->status === 'COMPLETED') {
					$archived_status = 'ARCHIVED_C';
				} else {
					// Skip other statuses
					continue;
				}

				$db->update(
					$taskTable,
					array(
						'status' => $archived_status,
						'updated_at' => $updated_at,
						'updated_by' => $updated_by,
					),
					array('id' => $task->id)
				);
			}

			return new WP_REST_Response(['status'=>200, 'message'=>'Section All Task Archived successfully'], 200);
		}
		
	}

	public function unarchiveTaskSection(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		
		$id = $request->get_param('id');
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		// $project_id = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;
		
		$task_id = isset($requestData['task_id']) && $requestData['task_id'] != "" ? (int)$requestData['task_id'] : null;

		$unarchiveSection = isset($requestData['unarchive_section']) && $requestData['unarchive_section'] === true;

		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';

		if($id && $unarchiveSection){
			$sectionTable = LAZYTASK_TABLE_PREFIX . 'task_sections';
			$section_query = $db->get_row(
				$db->prepare(
					"SELECT id, mark_is_complete FROM {$sectionTable} 
					WHERE deleted_at IS NULL
					AND id = %d",
					$id
				)
			);
			$status = '';
			if ($section_query) {
				if ($section_query->mark_is_complete === 'ARCHIVED_R') {
					$status = 'regular';
				} elseif ($section_query->mark_is_complete === 'ARCHIVED_C') {
					$status = 'complete';
				}
			} else {
				return new WP_Error('not_found', 'Section not found.', array('status' => 404));
			}

			$db->update(
				$sectionTable,
				array(
					'mark_is_complete' => $status,
					'updated_at' => $updated_at,
					'updated_by' => $updated_by,
				),
				array('id' => $id)
			);
			$message = 'Section Unarchived successfully';

			// return new WP_REST_Response(['status'=>200, 'message'=>'Section Unarchived successfully', 'section'=>$sectionResults], 200);
		}elseif($task_id){
			$task_query = $db->get_row(
				$db->prepare(
					"SELECT id, status FROM {$taskTable} 
					WHERE deleted_at IS NULL 
					AND parent_id IS NULL 
					AND id = %d",
					$task_id
				)
			);
			if ($task_query) {
				if ($task_query->status === 'ARCHIVED_A') {
					$status = 'ACTIVE';
				} elseif ($task_query->status === 'ARCHIVED_C') {
					$status = 'COMPLETED';
				}
			} else {
				return new WP_Error('not_found', 'Task not found.', array('status' => 404));
			}

			// update the task status
			$db->update(
				$taskTable,
				array(
					'status' => $status,
					'updated_at' => $updated_at,
					'updated_by' => $updated_by,
				),
				array('id' => $task_id)
			);

			// Archive all subtasks
			$db->query(
				$db->prepare(
					"UPDATE {$taskTable} 
					SET status = %s, updated_at = %s, updated_by = %s 
					WHERE deleted_at IS NULL AND parent_id = %d",
					$status, $updated_at, $updated_by, $task_id
				)
			);
			$message = 'Task Unarchived successfully';
			// if($taskResults){
			// 	return new WP_REST_Response(['status'=>200, 'message'=>'Task Unarchived successfully', 'tasks'=>$taskResults], 200);
			// }
		}
			$task = $this->getTaskById($task_id);
			if($task){
				$column[$task['section_slug']] = $task;
				$myTaskColumn = [];
				$currentDate = gmdate('Y-m-d');
				$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
				$myTaskColumn['all'] = $task;
				if($task['end_date'] < $currentDate){
					$task['my_task_section'] = 'overdue';
					$myTaskColumn['overdue'] = $task;
				}elseif($task['end_date'] == $currentDate){
					$task['my_task_section'] = 'today';
					$myTaskColumn['today'] = $task;
				}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
					$task['my_task_section'] = 'nextSevenDays';
					$myTaskColumn['nextSevenDays'] = $task;
				}else{
					$task['my_task_section'] = 'upcoming';
					$myTaskColumn['upcoming'] = $task;
				}
			}
			$sectionResults = $db->get_results($db->prepare("SELECT taskSections.id as sectionId, taskSections.name as sectionName FROM {$wpdb->prefix}pms_task_sections as taskSections WHERE taskSections.deleted_at IS NULL AND taskSections.mark_is_complete IN ('ARCHIVED_R', 'ARCHIVED_C') order by taskSections.updated_at ASC"), ARRAY_A);
			$taskResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder, 
				(
					SELECT COUNT(*) 
					FROM {$wpdb->prefix}pms_tasks as child 
					WHERE child.parent_id = tasks.id AND child.deleted_at IS NULL
				) as hasChild, 
				projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
				taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
				createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
				assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
				priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
				taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
					FROM {$wpdb->prefix}pms_tasks as tasks
					LEFT JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
					LEFT JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
					JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
					LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
					LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
					LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
					WHERE tasks.deleted_at IS NULL AND tasks.status IN ('ARCHIVED_A', 'ARCHIVED_C') order by tasks.updated_at ASC", ), ARRAY_A);
			$tasksId = array_column($taskResults, 'taskId');
			$taskMembers = $this->getTaskMembers($tasksId);
			foreach ($taskResults as &$task) {
				$taskId = $task['taskId'];
				$task['avatar'] = Lazytask_UserController::getUserAvatar($task['assignedToId']);
				$task['has_child'] = ((int) $task['hasChild'] > 0);
			}

		return new WP_REST_Response(['status'=>200, 'message'=>$message, 'sections'=>$sectionResults, 'tasks'=>$taskResults, 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn], 200);
	}

	public function archiveTaskList(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$taskResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder,
		(
            SELECT COUNT(*) 
            FROM {$wpdb->prefix}pms_tasks as child 
            WHERE child.parent_id = tasks.id AND child.deleted_at IS NULL
        ) as hasChild, 
       projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
       createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
		FROM {$wpdb->prefix}pms_tasks as tasks
    	LEFT JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    	LEFT JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    	JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
    	LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    	LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
		LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
        WHERE tasks.deleted_at IS NULL AND tasks.status IN ('ARCHIVED_A', 'ARCHIVED_C') order by tasks.updated_at ASC", ), ARRAY_A);

		$tasksId = array_column($taskResults, 'taskId');
		$taskMembers = $this->getTaskMembers($tasksId);
		foreach ($taskResults as &$task) {
			$taskId = $task['taskId'];
			$task['avatar'] = Lazytask_UserController::getUserAvatar($task['assignedToId']);
			$task['has_child'] = ((int) $task['hasChild'] > 0);
		}
		
		$sectionResults = $db->get_results($db->prepare("SELECT taskSections.id as sectionId, taskSections.name as sectionName FROM {$wpdb->prefix}pms_task_sections as taskSections WHERE taskSections.deleted_at IS NULL AND taskSections.mark_is_complete IN ('ARCHIVED_R', 'ARCHIVED_C') order by taskSections.updated_at ASC"), ARRAY_A);

		return new WP_REST_Response([
			'status' => 200, 
			'message' => 'Success',
			'tasks' => $taskResults,
			'sections' => $sectionResults
		], 200);
		
	}

	public function taskComplete(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		
		$id = $request->get_param('id');
		$type = isset($requestData['type']) && $requestData['type'] ? $requestData['type']:'task';
		$project_id = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
		$sectionTable = LAZYTASK_TABLE_PREFIX . 'task_sections';
		$status = 'COMPLETED';

		// Check if task is already completed
		$taskStatus = $db->get_var($db->prepare(
			"SELECT status FROM {$taskTable} WHERE id = %d",
			$id
		));
	
		if ($taskStatus === 'COMPLETED') {
			return new WP_REST_Response([
				'status' => '409',
				'message' => 'Task is already completed.',
				'data' => []
			]);
		}

		if($type === 'subtask'){
			// update the task status
			$db->update(
				$taskTable,
				array(
					'status' => $status,
					'updated_at' => $updated_at,
					'updated_by' => $updated_by,
				),
				array('id' => $id)
			);
		}else{

			$existCheckMarkIsComplete = $db->get_row($db->prepare("SELECT * FROM {$sectionTable} WHERE deleted_at IS NULL AND mark_is_complete='complete' AND project_id = %d", $project_id));
			//check complete section exits or not
			if(!$existCheckMarkIsComplete){
				return new WP_REST_Response(['status'=>'409', 'message' => 'No section mark as complete.', 'data' =>[]]);
			}

			// Get the max sort_order from complete section
			$maxSortOrder = $db->get_var($db->prepare(
				"SELECT MAX(sort_order) FROM {$taskTable} WHERE section_id = %d",
				$existCheckMarkIsComplete->id
			));
		
			$newSortOrder = ($maxSortOrder !== null) ? $maxSortOrder + 1 : 0;
	
			// update the task status
			$db->update(
				$taskTable,
				array(
					'section_id' => $existCheckMarkIsComplete->id,
					'status' => $status,
					'sort_order' => $newSortOrder,
					'updated_at' => $updated_at,
					'updated_by' => $updated_by,
				),
				array('id' => $id)
			);
		}


		$task = $this->getTaskById($id);

		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task Completed successfully', 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}
	}

	public function taskInComplete(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		
		$id = $request->get_param('id');
		$type = isset($requestData['type']) && $requestData['type'] ? $requestData['type']:'task';
		$project_id = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
		$sectionTable = LAZYTASK_TABLE_PREFIX . 'task_sections';
		$status = 'ACTIVE';

		// Check if task is already completed
		$taskStatus = $db->get_var($db->prepare(
			"SELECT status FROM {$taskTable} WHERE id = %d",
			$id
		));
	
		if ($taskStatus === 'ACTIVE') {
			return new WP_REST_Response([
				'status' => '409',
				'message' => 'Task is already completed.',
				'data' => []
			]);
		}

		if($type === 'subtask'){
			// update the task status
			$db->update(
				$taskTable,
				array(
					'status' => $status,
					'updated_at' => $updated_at,
					'updated_by' => $updated_by,
				),
				array('id' => $id)
			);
		}

		$task = $this->getTaskById($id);

		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task Incompleted successfully', 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}
	}

	public function convertToTask(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		
		$id = $request->get_param('id');
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
		$lastSerial = $wpdb->get_var("SELECT MAX(serial_no) FROM " . $taskTable);
		$newSerial = $lastSerial + 1 ;
		$subtask = $db->get_row($db->prepare("SELECT * FROM {$taskTable} WHERE id = %d",$id));
		
		// Get the max sort_order from complete section
		$maxSortOrder = $db->get_var($db->prepare(
			"SELECT MAX(sort_order) FROM {$taskTable} WHERE section_id = %d",
			$subtask->section_id
		));
	
		$newSortOrder = ($maxSortOrder !== null) ? $maxSortOrder + 1 : 0;

		if(!$subtask){
			return new WP_REST_Response(['status'=>'409', 'message' => 'Not found.', 'data' =>[]]);
		}

		// update the task status
		$db->update(
			$taskTable,
			array(
				'parent_id'  => null,
				'serial_no' => $newSerial,
				'sort_order' => $newSortOrder,
				'updated_at' => $updated_at,
				'updated_by' => $updated_by,
			),
			array('id' => $id)
		);

		$task = $this->getTaskById($id);

		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task Converted successfully', 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}
	}
	
	public function changeTaskPrivacy(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		
		$id = $request->get_param('id');
		$updated_at = current_time('mysql');
		$taskPrivacy = isset($requestData['taskPrivacy']) && $requestData['taskPrivacy'] != "" ? $requestData['taskPrivacy'] : null;
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';

		$task = $db->get_row($db->prepare("SELECT * FROM {$taskTable} WHERE id = %d",$id));
		if(!$task){
			return new WP_REST_Response(['status'=>'409', 'message' => 'Not found.', 'data' =>[]]);
		}

		// update the task status
		$db->update(
			$taskTable,
			array(
				'privacy' => $taskPrivacy,
				'updated_at' => $updated_at,
				'updated_by' => $updated_by,
			),
			array('id' => $id)
		);

		$task = $this->getTaskById($id);

		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task Visibility Changed successfully', 'data'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}
	}
	
	public function copyTask(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$taskId = $request->get_param('id');
		$createdBy = isset($requestData['created_by']) ? $requestData['created_by'] : null;

		// Get the original task
		$task = $this->getTaskById($taskId);
		if (!$task) {
			return new WP_REST_Response(['status'=>'409', 'message' => 'Original task not found.', 'data' =>[]], 409);
		}

		// Modify the name and slug for the copy
		// $copiedName = $task['name'] . ' (Copy)';

		$baseName = $task['name'];
		$likePattern = $wpdb->esc_like($baseName . ' (Copy') . '%';

		$existingNames = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT name FROM {$wpdb->prefix}pms_tasks WHERE name LIKE %s AND project_id = %d",
				$likePattern,
				$task['project_id']
			)
		);

		// Default to first copy
		$copyIndex = 1;
		foreach ($existingNames as $name) {
			if (preg_match('/\Q' . $baseName . '\E \(Copy(?: (\d+))?\)/', $name, $matches)) {
				$n = isset($matches[1]) ? (int)$matches[1] : 1;
				if ($n >= $copyIndex) {
					$copyIndex = $n + 1;
				}
			}
		}

		// Final name
		$copiedName = $copyIndex === 1 ? "$baseName (Copy)" : "$baseName (Copy $copyIndex)";

		$copiedSlug = Lazytask_SlugGenerator::slug($copiedName, self::TABLE_TASKS, 'slug');
		$created_at = current_time('mysql');

		// Start DB transaction
		$db->query('START TRANSACTION');

		// Get new sort order
		$sortOrder = $this->getMaxSortOrderBySectionId($task['task_section_id'], $task['project_id'], $task['parent_id']);
		$lastSerial = $wpdb->get_var("SELECT MAX(serial_no) FROM " . self::TABLE_TASKS);
		$newSerial = ($task['parent_id'] ? null : ($lastSerial ? $lastSerial + 1 : 1));

		// Insert copied task
		$newTaskData = [
			"serial_no" => $newSerial,
			"name" => $copiedName,
			"parent_id" => null,
			"project_id" => $task['project_id'],
			"section_id" => $task['task_section_id'],
			"priority_id" => $task['priority_id'],
			"internal_status_id" => $task['internal_status_id'],
			"assigned_to" => $task['assignedTo_id'],
			"start_date" => $task['start_date'],
			"start_date_is_visible" => $task['start_date_is_visible'],
			"end_date" => $task['end_date'],
			"end_date_is_visible" => $task['end_date_is_visible'],
			"created_by" => $createdBy,
			"slug" => $copiedSlug,
			"description" => $task['description'],
			"sort_order" => $sortOrder,
			'is_visible_on_gantt' => $task['is_visible_on_gantt'],
			"status" => $task['status'],
			"created_at" => $created_at,
			"privacy" => $task['taskPrivacy'],
		];

		$inserted = $db->insert(self::TABLE_TASKS, $newTaskData);

		if (!$inserted) {
			$db->query('ROLLBACK');
			return new WP_Error('db_insert_error', 'Failed to duplicate task.', ['status' => 500]);
		}

		$newTaskId = $wpdb->insert_id;

		// Duplicate Members
		if (!empty($task['members'])) {
			foreach ($task['members'] as $member) {
				$db->insert(self::TABLE_TASK_MEMBERS, [
					"task_id" => $newTaskId,
					"user_id" => $member['id'],
					"created_at" => $created_at,
					"updated_at" => $created_at,
				]);
			}
		}

		// Duplicate Tags
		$tagTable = LAZYTASK_TABLE_PREFIX . 'task_tags';
		$originalTags = $db->get_results($db->prepare("SELECT tag_id FROM $tagTable WHERE task_id = %d", $taskId));
		foreach ($originalTags as $tag) {
			$db->insert($tagTable, [
				"task_id" => $newTaskId,
				"tag_id" => $tag->tag_id,
				"user_id" => $createdBy,
				"created_at" => $created_at,
			]);
		}

		// Duplicate Attachments
		$attachmentTable = $wpdb->prefix . 'pms_attachments';
		$originalAttachments = $db->get_results($db->prepare("SELECT * FROM $attachmentTable WHERE subject_id = %d AND subject_type = 'task'", $taskId));
		foreach ($originalAttachments as $att) {
			$db->insert($attachmentTable, [
				'file_name' => $att->file_name,
				'file_path' => $att->file_path,
				'mine_type' => $att->mine_type,
				'size' => $att->size,
				'wp_attachment_id' => $att->wp_attachment_id,
				'subject_id' => $newTaskId,
				'subject_name' => 'task',
				'subject_type' => 'task',
				'user_id' => $createdBy,
				'created_at' => $created_at,
			]);
		}

		// --- Copy Subtasks ---
		$subtasks = $this->getSubtasksFlat($taskId);

		foreach ($subtasks as $subtask) {
			// Generate new name and slug for subtask
			$copiedSubtaskName = $subtask['name'] . ' (Copy)';
			$copiedSubtaskSlug = Lazytask_SlugGenerator::slug($copiedSubtaskName, self::TABLE_TASKS, 'slug');
			$subtaskSortOrder = $this->getMaxSortOrderBySectionId($subtask['section_id'], $subtask['project_id'], $newTaskId);
			$lastSerial = $wpdb->get_var("SELECT MAX(serial_no) FROM " . self::TABLE_TASKS);
			$newSerial = ($lastSerial ? $lastSerial + 1 : 1);

			// Insert copied subtask
			$newSubtaskData = [
				"serial_no" => $newSerial,
				"name" => $copiedSubtaskName,
				"parent_id" => $newTaskId, // Link to new parent
				"project_id" => $subtask['project_id'],
				"section_id" => $subtask['section_id'],
				"priority_id" => $subtask['priority_id'],
				"internal_status_id" => $subtask['internal_status_id'],
				"assigned_to" => $subtask['assigned_to'],
				"start_date" => $subtask['start_date'],
				"start_date_is_visible" => $subtask['start_date_is_visible'],
				"end_date" => $subtask['end_date'],
				"end_date_is_visible" => $subtask['end_date_is_visible'],
				"created_by" => $createdBy,
				"slug" => $copiedSubtaskSlug,
				"description" => $subtask['description'],
				"sort_order" => $subtaskSortOrder,
				'is_visible_on_gantt' => $subtask['is_visible_on_gantt'],
				"status" => 'ACTIVE',
				"created_at" => $created_at,
			];

			$insertedSubtask = $db->insert(self::TABLE_TASKS, $newSubtaskData);
			if (!$insertedSubtask) {
				$db->query('ROLLBACK');
				return new WP_Error('db_insert_error', 'Failed to duplicate subtask.', ['status' => 500]);
			}
			$newSubtaskId = $wpdb->insert_id;

			// Copy subtask members
			$subtaskMembers = $db->get_results($db->prepare(
				"SELECT user_id FROM {$wpdb->prefix}pms_task_members WHERE task_id = %d", $subtask['id']
			));
			foreach ($subtaskMembers as $member) {
				$db->insert(self::TABLE_TASK_MEMBERS, [
					"task_id" => $newSubtaskId,
					"user_id" => $member->user_id,
					"created_at" => $created_at,
					"updated_at" => $created_at,
				]);
			}

			// Copy subtask tags
			$subtaskTags = $db->get_results($db->prepare(
				"SELECT tag_id FROM {$wpdb->prefix}pms_task_tags WHERE task_id = %d", $subtask['id']
			));
			foreach ($subtaskTags as $tag) {
				$db->insert(LAZYTASK_TABLE_PREFIX . 'task_tags', [
					"task_id" => $newSubtaskId,
					"tag_id" => $tag->tag_id,
					"user_id" => $createdBy,
					"created_at" => $created_at,
				]);
			}

			// Copy subtask attachments
			$subtaskAttachments = $db->get_results($db->prepare(
				"SELECT * FROM {$wpdb->prefix}pms_attachments WHERE subject_id = %d AND subject_type = 'task'", $subtask['id']
			));
			foreach ($subtaskAttachments as $att) {
				$db->insert($wpdb->prefix . 'pms_attachments', [
					'file_name' => $att->file_name,
					'file_path' => $att->file_path,
					'mine_type' => $att->mine_type,
					'size' => $att->size,
					'wp_attachment_id' => $att->wp_attachment_id,
					'subject_id' => $newSubtaskId,
					'subject_name' => 'task',
					'subject_type' => 'task',
					'user_id' => $createdBy,
					'created_at' => $created_at,
				]);
			}

		}

		// Commit DB
		$db->query('COMMIT');

		// Get the newly created task to return
		$newTask = $this->getTaskById($newTaskId);
		

		if($newTask){
			// Fetch duplicated subtasks
			// $duplicatedSubtasks = $this->getSubTasksByTaskId($newTaskId);
			$duplicatedSubtasksResult = $this->getSubTasksByTaskId($newTaskId);
			$duplicatedSubtasks = $duplicatedSubtasksResult[$newTaskId]['child'] ?? [];

			// Attach subtasks to parent task
			$newTask['subtasks'] = array_map(function ($subtask) use ($newTask) {
				return [
					'id' => $subtask['id'],
					'name' => $subtask['name'],
					'slug' => $subtask['slug'],
					'section_slug' => $newTask['section_slug'] ?? null,
					'parent' => [
						'id' => $newTask['id'],
						'name' => $newTask['name'] ?? null,
						'slug' => $newTask['slug'] ?? null
					],
					'assigned_to' => $subtask['assigned_to'],
					'assignedTo_id' => $subtask['assignedTo_id'],
					'start_date' => $subtask['start_date'],
					'end_date' => $subtask['end_date'],
					'description' => $subtask['description'],
					'priority' => $subtask['priority'],
					'priority_id' => $subtask['priority_id'],
					'internal_status' => $subtask['internal_status'],
					'internal_status_id' => $subtask['internal_status_id'],
				];
			}, $duplicatedSubtasks);
			
			$column[$newTask['section_slug']] = $newTask;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $newTask;
			if($newTask['end_date'] < $currentDate){
				$newTask['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $newTask;
			}elseif($newTask['end_date'] == $currentDate){
				$newTask['my_task_section'] = 'today';
				$myTaskColumn['today'] = $newTask;
			}elseif($newTask['end_date'] > $currentDate && $newTask['end_date'] <= $next7Days){
				$newTask['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $newTask;
			}else{
				$newTask['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $newTask;
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Task duplicated successfully', 'data'=>$newTask, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
		}

		return new WP_Error('not_found', 'Task not found.', array('status' => 404));
	}

	private function getSubtasksFlat($parentTaskId)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$sql = "SELECT * FROM {$wpdb->prefix}pms_tasks WHERE parent_id = %d AND deleted_at IS NULL";
		$results = $db->get_results($db->prepare($sql, $parentTaskId), ARRAY_A);

		return $results ?: [];
	}

	public function copyTaskSection(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$id = $request->get_param('id');
		$createdBy = isset($requestData['created_by']) ? $requestData['created_by'] : null;

		// Get the original task section
		$taskSection = $this->getTaskSectionById($id);
		if (!$taskSection) {
			return new WP_REST_Response([
				'status' => 409,
				'message' => 'Original task section not found.',
				'data' => []
			], 409);
		}

		// Prepare and insert new section
		$tableTaskSection = LAZYTASK_TABLE_PREFIX . 'task_sections';
		$lastSerial = $wpdb->get_var($wpdb->prepare(
			"SELECT MAX(sort_order) FROM {$tableTaskSection} WHERE project_id = %d",
			$taskSection['project_id']
		));
		$newSerial = $lastSerial ? $lastSerial + 1 : 1;

		$newSectionData = [
			'name' => $taskSection['name'] . ' (Copy)',
			'project_id' => $taskSection['project_id'],
			'mark_is_complete' => 'regular',
			'sort_order' => $newSerial,
			'created_at' => current_time('mysql'),
			'updated_at' => current_time('mysql'),
			'created_by' => $createdBy,
			'updated_by' => $createdBy,
			'slug' => Lazytask_SlugGenerator::slug(wp_generate_uuid4(), $tableTaskSection, 'slug'),
		];

		$db->insert($tableTaskSection, $newSectionData);
		$newSectionId = $wpdb->insert_id;

		$newTaskSection = $this->getTaskSectionById($newSectionId);
		if (!$newTaskSection) {
			return new WP_REST_Response(['status' => 500, 'message' => 'Section copy failed.', 'data' => []], 500);
		}

		$returnArray = [];
		$returnArray['taskSections'] = $newTaskSection['slug'];
		$returnArray['tasks'][$newTaskSection['slug']] = [];
		$returnArray['taskListSectionsName'][$newTaskSection['slug']] = [
			'id' => $newTaskSection['id'],
			'name' => $newTaskSection['name'],
			'slug' => $newTaskSection['slug'],
			'sort_order' => $newTaskSection['sort_order'],
			'mark_is_complete' => $newTaskSection['mark_is_complete']
		];

		// Get and duplicate tasks in the original section
		$originalTasks = $db->get_results($wpdb->prepare(
			"SELECT * FROM " . self::TABLE_TASKS . " WHERE section_id = %d AND parent_id IS NULL",
			$id
		), ARRAY_A);

		foreach ($originalTasks as $task) {
			if (
				isset($task['privacy']) &&
				$task['privacy'] === 'private' &&
				$task['created_by'] != $createdBy
			) {
				continue;
			}
			$fullTaskData = $this->getTaskById($task['id']); // Include members, etc.
			$fullTaskData['task_section_id'] = $newSectionId; // override section ID
			$copiedTask = $this->copyTaskInternal($fullTaskData, $createdBy, $newSectionId);

			if ($copiedTask) {
				$returnArray['tasks'][$newTaskSection['slug']][$copiedTask['slug']] = $copiedTask;
			}
		}

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Section duplicated successfully',
			'data' => $returnArray
		], 200);
	}

	private function copyTaskInternal($task, $createdBy, $overrideSectionId = null)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$copiedName = $task['name'] . ' (Copy)';
		$copiedSlug = Lazytask_SlugGenerator::slug($copiedName, self::TABLE_TASKS, 'slug');
		$created_at = current_time('mysql');

		$sectionId = $overrideSectionId ?? $task['task_section_id'];

		$db->query('START TRANSACTION');

		$sortOrder = $this->getMaxSortOrderBySectionId($sectionId, $task['project_id'], null);
		$lastSerial = $wpdb->get_var("SELECT MAX(serial_no) FROM " . self::TABLE_TASKS);
		$newSerial = $lastSerial ? $lastSerial + 1 : 1;

		$newTaskData = [
			"serial_no" => $newSerial,
			"name" => $copiedName,
			"parent_id" => null,
			"project_id" => $task['project_id'],
			"section_id" => $sectionId,
			"priority_id" => $task['priority_id'],
			"internal_status_id" => $task['internal_status_id'],
			"assigned_to" => $task['assignedTo_id'],
			"start_date" => $task['start_date'],
			"start_date_is_visible" => $task['start_date_is_visible'],
			"end_date" => $task['end_date'],
			"end_date_is_visible" => $task['end_date_is_visible'],
			"created_by" => $createdBy,
			"slug" => $copiedSlug,
			"description" => $task['description'],
			"sort_order" => $sortOrder,
			'is_visible_on_gantt' => $task['is_visible_on_gantt'],
			"status" => $task['status'],
			"created_at" => $created_at,
			"privacy" => $task['taskPrivacy'],
		];

		$inserted = $db->insert(self::TABLE_TASKS, $newTaskData);
		if (!$inserted) {
			$db->query('ROLLBACK');
			return null;
		}

		$newTaskId = $wpdb->insert_id;

		// Members
		foreach ($task['members'] ?? [] as $member) {
			$db->insert(self::TABLE_TASK_MEMBERS, [
				"task_id" => $newTaskId,
				"user_id" => $member['id'],
				"created_at" => $created_at,
				"updated_at" => $created_at,
			]);
		}

		// Tags
		$tags = $db->get_results($db->prepare("SELECT tag_id FROM " . LAZYTASK_TABLE_PREFIX . "task_tags WHERE task_id = %d", $task['id']));
		foreach ($tags as $tag) {
			$db->insert(LAZYTASK_TABLE_PREFIX . 'task_tags', [
				"task_id" => $newTaskId,
				"tag_id" => $tag->tag_id,
				"user_id" => $createdBy,
				"created_at" => $created_at,
			]);
		}

		// Attachments
		$attachments = $db->get_results($db->prepare("SELECT * FROM {$wpdb->prefix}pms_attachments WHERE subject_id = %d AND subject_type = 'task'", $task['id']));
		foreach ($attachments as $att) {
			$db->insert($wpdb->prefix . 'pms_attachments', [
				'file_name' => $att->file_name,
				'file_path' => $att->file_path,
				'mine_type' => $att->mine_type,
				'size' => $att->size,
				'wp_attachment_id' => $att->wp_attachment_id,
				'subject_id' => $newTaskId,
				'subject_name' => 'task',
				'subject_type' => 'task',
				'user_id' => $createdBy,
				'created_at' => $created_at,
			]);
		}

		// Subtasks
		$subtasks = $this->getSubtasksFlat($task['id']);
		foreach ($subtasks as $subtask) {
			$subSlug = Lazytask_SlugGenerator::slug($subtask['name'] . ' (Copy)', self::TABLE_TASKS, 'slug');
			$subSortOrder = $this->getMaxSortOrderBySectionId($subtask['section_id'], $subtask['project_id'], $newTaskId);
			$newSubSerial = $wpdb->get_var("SELECT MAX(serial_no) FROM " . self::TABLE_TASKS) + 1;

			$subtaskData = [
				"serial_no" => $newSubSerial,
				"name" => $subtask['name'] . ' (Copy)',
				"parent_id" => $newTaskId,
				"project_id" => $subtask['project_id'],
				"section_id" => $sectionId,
				"priority_id" => $subtask['priority_id'],
				"internal_status_id" => $subtask['internal_status_id'],
				"assigned_to" => $subtask['assigned_to'],
				"start_date" => $subtask['start_date'],
				"start_date_is_visible" => $subtask['start_date_is_visible'],
				"end_date" => $subtask['end_date'],
				"end_date_is_visible" => $subtask['end_date_is_visible'],
				"created_by" => $createdBy,
				"slug" => $subSlug,
				"description" => $subtask['description'],
				"sort_order" => $subSortOrder,
				'is_visible_on_gantt' => $subtask['is_visible_on_gantt'],
				"status" => 'ACTIVE',
				"created_at" => $created_at,
			];
			$db->insert(self::TABLE_TASKS, $subtaskData);
			$newSubtaskId = $wpdb->insert_id;

			// Members
			$subMembers = $db->get_results($db->prepare("SELECT user_id FROM {$wpdb->prefix}pms_task_members WHERE task_id = %d", $subtask['id']));
			foreach ($subMembers as $m) {
				$db->insert(self::TABLE_TASK_MEMBERS, [
					'task_id' => $newSubtaskId,
					'user_id' => $m->user_id,
					'created_at' => $created_at,
					'updated_at' => $created_at,
				]);
			}

			// Tags
			$subTags = $db->get_results($db->prepare("SELECT tag_id FROM {$wpdb->prefix}pms_task_tags WHERE task_id = %d", $subtask['id']));
			foreach ($subTags as $tag) {
				$db->insert(LAZYTASK_TABLE_PREFIX . 'task_tags', [
					"task_id" => $newSubtaskId,
					"tag_id" => $tag->tag_id,
					"user_id" => $createdBy,
					"created_at" => $created_at,
				]);
			}

			// Attachments
			$subAttachments = $db->get_results($db->prepare("SELECT * FROM {$wpdb->prefix}pms_attachments WHERE subject_id = %d AND subject_type = 'task'", $subtask['id']));
			foreach ($subAttachments as $att) {
				$db->insert($wpdb->prefix . 'pms_attachments', [
					'file_name' => $att->file_name,
					'file_path' => $att->file_path,
					'mine_type' => $att->mine_type,
					'size' => $att->size,
					'wp_attachment_id' => $att->wp_attachment_id,
					'subject_id' => $newSubtaskId,
					'subject_name' => 'task',
					'subject_type' => 'task',
					'user_id' => $createdBy,
					'created_at' => $created_at,
				]);
			}
		}

		$db->query('COMMIT');

		// Return full task
		return $this->getTaskById($newTaskId);
	}

	public function toggleSectionTasksGanttView(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$id = $request->get_param('id');
		$updated_at = current_time('mysql');
		$type = isset($requestData['type']) && $requestData['type'] != "" ? $requestData['type'] : null;
		$created_by = isset($requestData['created_by']) && $requestData['created_by'] != "" ? (int)$requestData['created_by'] : null;
		$project_id = isset($requestData['project_id']) && $requestData['project_id'] != "" ? (int)$requestData['project_id'] : null;

		$taskTable = self::TABLE_TASKS;

		$tasks = $db->get_results(
			$db->prepare("SELECT id, name, is_visible_on_gantt FROM $taskTable WHERE section_id = %d AND deleted_at IS NULL", $id
		), ARRAY_A);

		if($tasks && sizeof($tasks)>0){
			foreach ($tasks as $task) {
				if($type && $type == 'add'){
					$is_visible_on_gantt = 1;
				}elseif($type && $type == 'remove'){
					$is_visible_on_gantt = 0;
				}else{
					$is_visible_on_gantt = 0;
				}
				$db->update(
					$taskTable,
					array(
						'is_visible_on_gantt' => $is_visible_on_gantt,
						'updated_at' => $updated_at,
						'updated_by' => $created_by,
					),
					array('id' => $task['id'])
				);
			}
		}

		$taskSection = $this->getTaskSectionById($id);
		if (!$taskSection) {
			return new WP_REST_Response(['status' => 500, 'message' => 'Section copy failed.', 'data' => []], 500);
		}
		$limit = 10;
		$offset = 0;
		$requestData = [
			'section_id' => $id,
			'limit' => $limit,
			'offset' => $offset
		];
		$tasks = $this->getPaginatedTasksByProjectId($project_id, $requestData);
		$sectionTasks = $tasks['sectionData'][$taskSection['slug']] ?? [];
		$childTasks = $tasks['childData'] ?? [];

		$returnArray = [];
		$returnArray['taskSections'] = $taskSection['slug'];
		$returnArray['tasks'] = $sectionTasks;
		$returnArray['childTasks'] = $childTasks;

		return new WP_REST_Response(['status'=>200, 'message'=>'All Tasks Added On Gantt','data' => $returnArray], 200);
	}

	public function softDeleteTaskSection(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$id = $request->get_param('id');
		$deleted_at = current_time('mysql');
		$deleted_by = isset($requestData['deleted_by']) && $requestData['deleted_by'] != "" ? (int)$requestData['deleted_by'] : null;

		$tableTaskSection = LAZYTASK_TABLE_PREFIX . 'task_sections';

		$db->query('START TRANSACTION');
		$taskSectionDeleted= false;
		if($id && $deleted_at && $deleted_by){
			$taskSectionDeleted = $db->update(
				$tableTaskSection,
				array(
					"deleted_at" => $deleted_at,
					"deleted_by" => $deleted_by,
				),
				array( 'id' => $id )
			);
		}

		// Check if the task was updated successfully
		if (!$taskSectionDeleted) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_Error('db_update_error', 'Could not delete task section in the database.', array('status' => 500));
		}

		// activity log for task delete
		$properties['attributes'] = [
			'deleted_by' => $deleted_by,
			'deleted_at' => $deleted_at,
			'status' => 0,
		];
		$activityLogArg = [
			"user_id" => $deleted_by,
			"subject_id" => $id,
			"subject_name" => 'section',
			"subject_type" => 'section',
			"event" => 'deleted',
			"properties" => wp_json_encode($properties),
			"created_at" => $deleted_at,
		];
		$activitiesLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
		$db->insert($activitiesLogTable, $activityLogArg);

		$db->query('COMMIT');

		$taskSection = $this->getTaskSectionById($id);
		if($taskSection){
			$returnArray['taskSections'] = $taskSection['slug'];
			$returnArray['taskListSectionsName'][$taskSection['slug']] = ['id'=> $taskSection['id'], 'name' => $taskSection['name'], 'slug' => $taskSection['slug'], 'sort_order' => $taskSection['sort_order'], 'mark_is_complete' => $taskSection['mark_is_complete'] ] ;
			return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $returnArray], 200);
		}
		return new WP_Error('not_found', 'Task section not found.', array('status' => 404));
	}

	public function updateSectionSortOrder(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();

		$project_id = $requestData['project_id'];
		$orderedList = $requestData['orderedList'];
		$updated_at = current_time('mysql');
		$updated_by = isset($requestData['updated_by']) && $requestData['updated_by'] != "" ? (int)$requestData['updated_by'] : null;

		$tableTaskSection = LAZYTASK_TABLE_PREFIX . 'task_sections';

		$db->query('START TRANSACTION');

		if($project_id && sizeof($orderedList)>0){
			foreach ($orderedList as $key => $value) {
				$db->update(
					$tableTaskSection,
					array(
						"sort_order" => (int)$key,
						"updated_at" => $updated_at,
						"updated_by" => $updated_by,
					),
					array( 'project_id' => $project_id, 'slug' => $value )
				);
			}
		}

		$db->query('COMMIT');

		return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $orderedList], 200);
	}

	public function getTaskSectionById($taskSectionId)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$taskSection = $db->get_row($db->prepare(
			"SELECT taskSection.id, taskSection.name, taskSection.slug, taskSection.sort_order, taskSection.mark_is_complete, projects.name as project_name, projects.id as project_id 
			FROM `{$wpdb->prefix}pms_task_sections` as taskSection
		 JOIN `{$wpdb->prefix}pms_projects` as projects ON taskSection.project_id = projects.id
		 WHERE taskSection.id = %d", $taskSectionId), ARRAY_A);

		if($taskSection){
			return $taskSection;
		}

		return null;
	}

	public function createComment(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		// Sanitize and validate the input data
		$requestData = $request->get_json_params();
		$content = wp_kses_post($requestData['content']);
		$parentId = isset($requestData['parent_id']) && $requestData['parent_id'] != "" ? (int)$requestData['parent'] : null;
		$commentableId = isset($requestData['commentable_id']) && $requestData['commentable_id'] != "" ? (int)$requestData['commentable_id'] : null;
		$userId = isset($requestData['user_id']) && $requestData['user_id'] != "" ? (int)$requestData['user_id'] : null;
		$commentableType = isset($requestData['commentable_type']) && $requestData['commentable_type'] != "" ? $requestData['commentable_type'] : null;
		$created_at = current_time('mysql');
		$mention_users = isset($requestData['mention_users']) && sizeof($requestData['mention_users']) > 0 ? $requestData['mention_users'] : [];
		
		$loggedInUser = get_user_by('ID', $userId);
		if (empty($content)) {
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}

		if(empty($commentableId)){
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}
		if(empty($userId)){
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}

		// Start a transaction
		$db->query('START TRANSACTION');
	 $commentsTable = LAZYTASK_TABLE_PREFIX . 'comments';
		// Insert the task into the database
		$commentInserted = $db->insert(
			$commentsTable,
			array(
				"content" => $content,
				"parent_id" => $parentId,
				"commentable_id" => $commentableId,
				"commentable_type" => $commentableType,
				"user_id" => $userId,
				"created_at" => $created_at,
			)
		);

		// Check if the task was inserted successfully
		if (!$commentInserted) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_Error('db_insert_error', 'Could not insert comment into the database.', array('status' => 500));
		}

		$commentId = $wpdb->insert_id;

		foreach($mention_users as $mentioned_user){
			// Prepare data for notification
			$referenceInfo = [
				'id' => $commentableId,
				'name' => "Task Comment", 
				'type' => 'mention'
			];
			
			$placeholdersArray = [
				'member_name' => $mentioned_user['name'],
				'task_name' => "Comment",
				'project_name' => '',
				'creator_name' => $loggedInUser ? $loggedInUser->display_name : '',
				'description' => $content
			];
			// Trigger notification action
			do_action(
				'lazytask_task_member_mention', 
				$referenceInfo,
				['web-app'],
				[$mentioned_user['id']],
				$placeholdersArray
			);
		}


		// activity log for task delete
		$properties['attributes'] = [
			'comment_id' => $commentId,
			'comment' => 'Comment has been created',
			'created_by' => $userId,
			'created_at' => $created_at,
		];
		$activityLogArg = [
			"user_id" => $userId,
			"subject_id" => $commentableId,
			"subject_name" => 'task',
			"subject_type" => 'comment',
			"event" => 'created',
			"properties" => wp_json_encode($properties),
			"created_at" => $created_at,
		];
		$activitiesLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
		$db->insert($activitiesLogTable, $activityLogArg);

		// Commit the transaction
		$db->query('COMMIT');

		$task = $this->getTaskById($commentableId);
		if($task){
			$column[$task['section_slug']] = $task;
			$myTaskColumn = [];
			$currentDate = gmdate('Y-m-d');
			$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
			$myTaskColumn['all'] = $task;
			if($task['end_date'] < $currentDate){
				$task['my_task_section'] = 'overdue';
				$myTaskColumn['overdue'] = $task;
			}elseif($task['end_date'] == $currentDate){
				$task['my_task_section'] = 'today';
				$myTaskColumn['today'] = $task;
			}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
				$task['my_task_section'] = 'nextSevenDays';
				$myTaskColumn['nextSevenDays'] = $task;
			}else{
				$task['my_task_section'] = 'upcoming';
				$myTaskColumn['upcoming'] = $task;
			}
			$comment = $this->getCommentsById($commentId);
			return new WP_REST_Response(['status'=>200, 'message'=>'Comment created successfully', 'data'=>$comment, 'task'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn, 'loggedUserID'=>$userId ], 200);
		}

		return new WP_Error('not_found', 'Task not found.', array('status' => 404));
	}

	// delete comment by id
	public function softDeleteComment(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$commentId = $request->get_param('id');
		$requestData = $request->get_json_params();

		$deleted_at = current_time('mysql');
		$deleted_by = isset($requestData['deleted_by']) && $requestData['deleted_by'] != "" ? (int)$requestData['deleted_by'] : null;

		$tableComments = LAZYTASK_TABLE_PREFIX . 'comments';
		// task soft delete by task id
		$db->query('START TRANSACTION');
		$commentDeleted = $db->update(
			$tableComments,
			array(
				"deleted_at" => $deleted_at,
				"deleted_by" => $deleted_by,
				"status" => 0,
			),
			array( 'id' => $commentId )
		);

		if (!$commentDeleted) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_Error('db_update_error', 'Could not delete comment in the database.', array('status' => 500));
		}

		$comment = $this->getCommentsById($commentId);

		// activity log for comment delete
		$properties['attributes'] = [
			'deleted_by' => $deleted_by,
			'deleted_at' => $deleted_at,
			'comment_id' => $commentId,
			'comment' => 'Comment has been deleted',
		];
		$activityLogArg = [
			"user_id" => $deleted_by,
			"subject_id" => $comment ? $comment['commentable_id'] : null,
			"subject_name" => 'task',
			"subject_type" => 'comment',
			"event" => 'deleted',
			"properties" => wp_json_encode($properties),
			"created_at" => $deleted_at,
		];
		$activitiesLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
		$db->insert($activitiesLogTable, $activityLogArg);
		// Commit the transaction
		$db->query('COMMIT');

		if($comment){
			$task = $this->getTaskById($comment['commentable_id']);
			if($task){
				$column[$task['section_slug']] = $task;
				$myTaskColumn = [];
				$currentDate = gmdate('Y-m-d');
				$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
				$myTaskColumn['all'] = $task;
				if($task['end_date'] < $currentDate){
					$task['my_task_section'] = 'overdue';
					$myTaskColumn['overdue'] = $task;
				}elseif($task['end_date'] == $currentDate){
					$task['my_task_section'] = 'today';
					$myTaskColumn['today'] = $task;
				}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
					$task['my_task_section'] = 'nextSevenDays';
					$myTaskColumn['next'] = $task;
				}else{
					$task['my_task_section'] = 'upcoming';
					$myTaskColumn['upcoming'] = $task;
				}
				return new WP_REST_Response(['status'=>200, 'message'=>'Comment deleted successfully', 'data'=>$comment, 'task'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn ], 200);
			}
		}
		return new WP_Error('not_found', 'Comment not found.', array('status' => 404));

	}


	public function getCommentsById($id)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$commentsTable = LAZYTASK_TABLE_PREFIX . 'comments';
		$usersTable = $wpdb->prefix . 'users';

		$row = $db->get_row($db->prepare(
			"SELECT comments.id, comments.content, comments.parent_id, comments.commentable_id, comments.commentable_type, comments.user_id, comments.created_at, comments.updated_at, users.display_name as user_name, users.user_email as user_email 
			FROM {$commentsTable} as comments
         JOIN {$usersTable} as users ON comments.user_id = users.ID
         WHERE comments.id = %d order by id DESC", (int)$id), ARRAY_A);
		$returnArray= [];
		if($row){
//			$row['children'] = $this->getCommentsByParentId($row['id']);

			$returnArray = [
				'id' => $row['id'],
				'content' => $row['content'],
				'parent_id' => $row['parent_id'],
				'commentable_id' => $row['commentable_id'],
				'commentable_type' => $row['commentable_type'],
				'user_id' => $row['user_id'],
				'user_name' => $row['user_name'],
				'user_email' => $row['user_email'],
				'avatar' => Lazytask_UserController::getUserAvatar($row['user_id']),
				'created_at' => $row['created_at'],
				'updated_at' => $row['updated_at'],
				'children' => []
			];
		}

		return $returnArray;
	}

	public function getCommentsByTaskId($commentableId, $commentableType)
	{

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$commentsTable = LAZYTASK_TABLE_PREFIX . 'comments';
		$usersTable = $wpdb->prefix . 'users';

		if (is_array($commentableId)) {
			$ids = implode(', ', array_fill(0, count($commentableId), '%s'));
		}else{
			$ids = '%s';
			$commentableId = [$commentableId];
		}

		$sql = "SELECT comments.id, comments.content, comments.parent_id, comments.commentable_id, comments.commentable_type, comments.user_id, comments.created_at, comments.updated_at, users.display_name as user_name, users.user_email as user_email 
		FROM {$commentsTable} as comments
		 JOIN {$usersTable} as users ON comments.user_id = users.ID
		 WHERE comments.deleted_at IS NULL AND comments.deleted_by IS NULL AND comments.commentable_id IN ($ids) and comments.commentable_type = '{$commentableType}' order by comments.id DESC";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $commentableId));

		$allResults = $db->get_results( $query, ARRAY_A);

		$returnArray = null;
		if ($allResults){
			$parentResults = array_filter($allResults, function($item)  {
				return $item['parent_id'] == '' && $item['parent_id'] == null;
			});

			$childResults = array_filter($allResults, function($item)  {
				return $item['parent_id'] != '' && $item['parent_id'] != null;
			});
			if($parentResults && sizeof($parentResults)>0){
				foreach ( $parentResults as $parent_result ) {
					$returnArray[$parent_result['commentable_id']][] = [
						'id' => $parent_result['id'],
						'content' => $parent_result['content'],
						'parent_id' => $parent_result['parent_id'],
						'commentable_id' => $parent_result['commentable_id'],
						'commentable_type' => $parent_result['commentable_type'],
						'user_id' => $parent_result['user_id'],
						'user_name' => $parent_result['user_name'],
						'user_email' => $parent_result['user_email'],
						'avatar' => Lazytask_UserController::getUserAvatar($parent_result['user_id']),
						'created_at' => $parent_result['created_at'],
						'updated_at' => $parent_result['updated_at'],
						'children' => $childResults && sizeof($childResults)>0 ? array_filter($childResults, function($item) use ($parent_result) {
							return $item['parent_id'] == $parent_result['id'];
						}) : [],
					];

				}
			}
		}
		return $returnArray;

	}

	public function getActivityLogsByTaskId($subjectId, $subjectName)
	{

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$activityLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
		$usersTable = $wpdb->prefix . 'users';

		if (is_array($subjectId)) {
			$ids = implode(', ', array_fill(0, count($subjectId), '%s'));
		}else{
			$ids = '%s';
			$subjectId = [$subjectId];
		}

		$sql = "SELECT activityLog.id, activityLog.properties, activityLog.subject_id, activityLog.subject_name, activityLog.subject_type, activityLog.user_id, activityLog.event, activityLog.created_at, activityLog.updated_at, users.display_name as user_name, users.user_email as user_email FROM `{$activityLogTable}` as activityLog
		 JOIN `{$usersTable}` as users ON activityLog.user_id = users.ID
		 WHERE activityLog.subject_id IN ($ids) and activityLog.subject_name = '{$subjectName}' order by activityLog.id DESC";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $subjectId));

		$allResults = $db->get_results($query, ARRAY_A);

		$returnArray = [];
		if($allResults && sizeof($allResults)>0){
			foreach ( $allResults as $all_result ) {
				$returnArray[$all_result['subject_id']][] = [
					'id' => $all_result['id'],
					'properties' => json_decode($all_result['properties'], true),
					'subject_id' => $all_result['subject_id'],
					'subject_name' => $all_result['subject_name'],
					'subject_type' => $all_result['subject_type'],
					'user_id' => $all_result['user_id'],
					'user_name' => $all_result['user_name'],
					'user_email' => $all_result['user_email'],
					'event' => $all_result['event'],
					'created_at' => $all_result['created_at'],
					'updated_at' => $all_result['updated_at'],
					'avatar' => Lazytask_UserController::getUserAvatar($all_result['user_id']),
				];
			}
		}
		return $returnArray;

	}

	public function getActivityLogByUserId(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$activityLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
		$usersTable = $wpdb->prefix . 'users';
		$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';

		$id = (int) $request->get_param('id');
		if (empty($id)) {
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}

		$taskIds = $db->get_col($db->prepare("SELECT id FROM {$taskTable} WHERE status = 'ACTIVE' AND (assigned_to = %d OR created_by = %d)", $id, $id));
		if (!empty($taskIds)) {
    		$placeholders = implode(',', array_fill(0, count($taskIds), '%d'));

			$sql = $db->prepare(
				"SELECT 
					activityLog.id, 
					activityLog.properties, 
					activityLog.subject_id, 
					activityLog.subject_name, 
					activityLog.subject_type, 
					activityLog.user_id, 
					activityLog.event, 
					activityLog.created_at, 
					activityLog.updated_at, 
					users.display_name AS user_name, 
					users.user_email AS user_email
				FROM {$activityLogTable} AS activityLog
				JOIN {$usersTable} AS users ON activityLog.user_id = users.ID
				WHERE activityLog.subject_id IN ($placeholders)
				ORDER BY activityLog.id DESC 
				LIMIT 20",
				...$taskIds
			);
		} else {
			return new WP_REST_Response(['status'=>200, 'message'=>'No activities found for this user', 'data'=>[] ], 200);
		}

		$allResults = $db->get_results($sql, ARRAY_A);

		$returnArray = [];
		if (!empty($allResults)) {
			foreach ($allResults as $row) {
				$created_at_formatted = $row['created_at'] ? date('d F Y H:i', strtotime($row['created_at'])) : null;
    			$updated_at_formatted = $row['updated_at'] ? date('d F Y H:i', strtotime($row['updated_at'])) : null;

				$returnArray[] = [
					'id'           => $row['id'],
					'properties'   => json_decode($row['properties'], true),
					'subject_id'   => $row['subject_id'],
					'subject_name' => $row['subject_name'],
					'subject_type' => $row['subject_type'],
					'event'        => $row['event'],
					'created_at'   => $row['created_at'],
					'created_at_formatted' => $created_at_formatted,
					'updated_at_formatted' => $updated_at_formatted,
					'updated_at'   => $row['updated_at'],
					'user'         => [
						'id'     => $row['user_id'],
						'name'   => $row['user_name'],
						'email'  => $row['user_email'],
						'avatar' => Lazytask_UserController::getUserAvatar($row['user_id']),
					],
				];
			}
		}

		return new WP_REST_Response(['status'=>200, 'message'=>'Activities Fetched Successfully', 'data'=>$returnArray ], 200);

	}


	public function createAttachment(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		// Sanitize and validate the input data
		$requestData = $request->get_body_params();
		$requestFileData = $request->get_file_params();

		$taskId = $requestData['task_id'];
		$userId = $requestData['user_id'];
		$file_upload_response=[];

		if($taskId){
			require_once(ABSPATH . 'wp-admin/includes/file.php');
			require_once(ABSPATH . 'wp-admin/includes/image.php');
			if($requestFileData && sizeof($requestFileData)>0){
				$uploadedFiles = [];
				$count = 1;
				foreach ( $requestFileData as $file){
					$upload_overrides = array('test_form' => false);

					$moveFile = wp_handle_upload($file, $upload_overrides);

					if($moveFile){
						$attachment = array(
							'post_author' => $userId,
							'post_title' => $file['name'],
							'post_content' => '',
							'post_status' => 'inherit',
							'post_mime_type' => image_type_to_mime_type(exif_imagetype($moveFile['file']))
						);

						$attachment_id = wp_insert_attachment($attachment, $moveFile['file']);

						$attach_data = wp_generate_attachment_metadata($attachment_id, $moveFile['file']);
						wp_update_attachment_metadata($attachment_id, $attach_data);

						if($attachment_id){
							$tableAttachments = $wpdb->prefix. 'pms_attachments';
							$db->insert(
								$tableAttachments,
								array(
									'file_name'=>isset( $file['name']) ? $file['name']: null,
									'file_path'=>isset( $moveFile['url']) ? $moveFile['url']: null,
									'mine_type' => isset( $file['type']) ? $file['type']: null,
									'size' => isset( $file['size']) ? $file['size']: null,
									'wp_attachment_id' => $attachment_id,
									"subject_id" => $taskId,
									"subject_name" => 'task',
									"subject_type"=>'task',
									"user_id" => $userId,
									"created_at" => current_time('mysql'),
								)
							);

							$uploadedFiles[] = isset( $file['name']) ? $count.'. '. $file['name']: null;
							$count++;
						}
					}

				}

				$argTask= [];
				$argTask['name'] = implode(', ', $uploadedFiles);
				$argTask['message'] = 'Attachment upload';
				$properties['attributes'] = $argTask;
				$created_at= current_time('mysql');

				$activityLogArg = [
					"user_id" => $userId,
					"subject_id" => $taskId,
					"subject_name" => 'task',
					"subject_type" => 'task',
					"event" => 'attachment-upload',
					"properties" => wp_json_encode($properties),
					"created_at" => $created_at,
				];

				$activityLogInserted = $db->insert(self::TABLE_ACTIVITY_LOG, $activityLogArg);

			}

//			$attachments = $this->getAttachmentsByTaskId($taskId, 'task');
			$task = $this->getTaskById($taskId);
			if($task){
				$column[$task['section_slug']] = $task;
				$myTaskColumn = [];
				$currentDate = gmdate('Y-m-d');
				$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
				$myTaskColumn['all'] = $task;
				if($task['end_date'] < $currentDate){
					$task['my_task_section'] = 'overdue';
					$myTaskColumn['overdue'] = $task;
				}elseif($task['end_date'] == $currentDate){
					$task['my_task_section'] = 'today';
					$myTaskColumn['today'] = $task;
				}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
					$task['my_task_section'] = 'nextSevenDays';
					$myTaskColumn['nextSevenDays'] = $task;
				}else{
					$task['my_task_section'] = 'upcoming';
					$myTaskColumn['upcoming'] = $task;
				}
				return new WP_REST_Response(['status'=>200, 'message'=>'Attachment upload successfully', 'data'=>$task['attachments'], 'task'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn, 'loggedUserID'=>$userId ], 200);
			}

		}
		return new WP_Error('not_found', 'Task not found.', array('status' => 404));
	}

	//delete task attachment
	public function deleteAttachment(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$id = $request->get_param('id');

		$userId = $request->get_param('deleted_by');
		$taskId = $request->get_param('task_id');
//		return new WP_REST_Response(['status'=>200, 'message'=>'Attachment remove successfully', 'data'=>$taskId, 'loggedUserID'=>$userId ], 200);

		$attachment = $this->getAttachmentById($id);
		if($attachment){
			$tableAttachments = $wpdb->prefix. 'pms_attachments';
			$db->delete($tableAttachments, array('id' => $id));

			wp_delete_attachment($attachment['wp_attachment_id'], true);

			$argTask= [];
			$argTask['name'] = $attachment['name'];
			$argTask['message'] = 'Attachment removed';
			$properties['attributes'] = $argTask;
			$created_at= current_time('mysql');

			$activityLogArg = [
				"user_id" => $userId,
				"subject_id" => $taskId,
				"subject_name" => 'task',
				"subject_type" => 'task',
				"event" => 'attachment-removed',
				"properties" => wp_json_encode($properties),
				"created_at" => $created_at,
			];

			$activityLogInserted = $db->insert(self::TABLE_ACTIVITY_LOG, $activityLogArg);


			$task = $this->getTaskById($taskId);
			if($task){
				$column[$task['section_slug']] = $task;
				$myTaskColumn = [];
				$currentDate = gmdate('Y-m-d');
				$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
				$myTaskColumn['all'] = $task;
				if($task['end_date'] < $currentDate){
					$task['my_task_section'] = 'overdue';
					$myTaskColumn['overdue'] = $task;
				}elseif($task['end_date'] == $currentDate){
					$task['my_task_section'] = 'today';
					$myTaskColumn['today'] = $task;
				}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
					$task['my_task_section'] = 'nextSevenDays';
					$myTaskColumn['nextSevenDays'] = $task;
				}else{
					$task['my_task_section'] = 'upcoming';
					$myTaskColumn['upcoming'] = $task;
				}
				return new WP_REST_Response(['status'=>200, 'message'=>'Attachment remove successfully', 'data'=>$task['attachments'], 'task'=>$task, 'column'=> $column, 'myTaskColumn'=>$myTaskColumn, 'loggedUserID'=>$userId ], 200);
			}
		}
		return new WP_Error('not_found', 'Attachment not found.', array('status' =>''));
	}


	public function getAttachmentsByTaskId($taskId, $subjectName = 'task')
	{

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$attachmentsTable = LAZYTASK_TABLE_PREFIX . 'attachments';
		$usersTable = $wpdb->prefix . 'users';

		if (is_array($taskId)) {
			$ids = implode(', ', array_fill(0, count($taskId), '%s'));
		}else{
			$ids = '%s';
			$taskId = [$taskId];
		}

		$sql = "SELECT attachments.id, attachments.file_name, attachments.file_path, attachments.mine_type, attachments.size, attachments.wp_attachment_id, attachments.subject_id, attachments.subject_name, attachments.subject_type, attachments.user_id, attachments.created_at, users.display_name as user_name, users.user_email as user_email FROM `{$attachmentsTable}` as attachments
		 JOIN `{$usersTable}` as users ON attachments.user_id = users.ID
		 WHERE attachments.subject_id IN ($ids) and attachments.subject_name = '{$subjectName}' order by attachments.id DESC";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $taskId));

		$allResults = $db->get_results( $query, ARRAY_A);

		$returnArray = [];
		if ($allResults){
			foreach ( $allResults as $all_result ) {
				$returnArray[$all_result['subject_id']][] = [
					'id' => $all_result['id'],
					'name' => $all_result['file_name'],
					'file_path' => $all_result['file_path'],
					'mine_type' => $all_result['mine_type'],
					'size' => $all_result['size'],
					'wp_attachment_id' => $all_result['wp_attachment_id'],
					'subject_id' => $all_result['subject_id'],
					'subject_name' => $all_result['subject_name'],
					'subject_type' => $all_result['subject_type'],
					'user_id' => $all_result['user_id'],
					'user_name' => $all_result['user_name'],
					'user_email' => $all_result['user_email'],
					'created_at' => $all_result['created_at'],
				];
			}
		}
		return $returnArray;

	}
	// task attachment by id
	public function getAttachmentById($id)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$attachmentsTable = LAZYTASK_TABLE_PREFIX . 'attachments';
		$usersTable = $wpdb->prefix . 'users';

		$row = $db->get_row($db->prepare(
			"SELECT attachments.id, attachments.file_name, attachments.file_path, attachments.mine_type, attachments.size, attachments.wp_attachment_id, attachments.subject_id, attachments.subject_name, attachments.subject_type, attachments.user_id, attachments.created_at, users.display_name as user_name, users.user_email as user_email 
			FROM {$attachmentsTable} as attachments
		 JOIN {$usersTable} as users ON attachments.user_id = users.ID
		 WHERE attachments.id = %d order by id DESC", (int)$id), ARRAY_A);
		$returnArray= [];
		if($row){
			$returnArray = [
				'id' => $row['id'],
				'name' => $row['file_name'],
				'file_path' => $row['file_path'],
				'mine_type' => $row['mine_type'],
				'size' => $row['size'],
				'wp_attachment_id' => $row['wp_attachment_id'],
				'subject_id' => $row['subject_id'],
				'subject_name' => $row['subject_name'],
				'subject_type' => $row['subject_type'],
				'user_id' => $row['user_id'],
				'user_name' => $row['user_name'],
				'user_email' => $row['user_email'],
				'created_at' => $row['created_at'],
			];
		}

		return $returnArray;
	}

	public function tagAssignToTask( WP_REST_Request $request)
	{

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$taskTagsTable = LAZYTASK_TABLE_PREFIX . 'task_tags';

		$requestData = $request->get_json_params();
		$tagName = sanitize_text_field($requestData['name']);
		$taskId = isset($requestData['task_id']) && $requestData['task_id'] != "" ? (int)$requestData['task_id'] : null;
		$userId = isset($requestData['user_id']) && $requestData['user_id'] != "" ? (int)$requestData['user_id'] : null;

		if($tagName){
			$tagObj = new Lazytask_TagController();
			$tag = $tagObj->tagGetOrCreate($requestData);
			$submittedData=[];
			if($tag && $taskId){
				$tagId = (int)$tag['id'];
				$existingTaskTag = $db->get_row($db->prepare("SELECT * FROM `{$wpdb->prefix}pms_task_tags` WHERE deleted_by IS NULL and deleted_at IS NULL and tag_id = %d and task_id = %d", $tagId, $taskId), ARRAY_A);
				if(!$existingTaskTag){
					$submittedData['tag_id']=$tag['id'];
					$submittedData['task_id']=$taskId;
					$submittedData['user_id']=$userId;
					$submittedData['created_at']=current_time('mysql');
					$db->insert($taskTagsTable, $submittedData);
				}
				$task = $this->getTaskById($taskId);
				$taskTags = $task && isset($task['tags']) ? $task['tags'] : [];
				$myTaskColumn = [];
				if($task){
					$currentDate = gmdate('Y-m-d');
					$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
					$myTaskColumn['all'] = $task;
					if($task['end_date'] < $currentDate){
						$task['my_task_section'] = 'overdue';
						$myTaskColumn['overdue'] = $task;
					}elseif($task['end_date'] == $currentDate){
						$task['my_task_section'] = 'today';
						$myTaskColumn['today'] = $task;
					}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
						$task['my_task_section'] = 'nextSevenDays';
						$myTaskColumn['nextSevenDays'] = $task;
					}else{
						$task['my_task_section'] = 'upcoming';
						$myTaskColumn['upcoming'] = $task;
					}
				}

				return new WP_REST_Response(['status'=>200, 'message'=>'Tag assign successfully', 'data'=>$taskTags, 'task'=>$task, 'tag'=>$tag, 'myTaskColumn'=>$myTaskColumn ], 200);
			}

			return new WP_REST_Response(['status'=>200, 'message'=>'Tag assign successfully', 'data'=>[], 'task'=>null, 'tag'=>$tag ,'myTaskColumn'=>[] ], 200);

		}

		return new WP_REST_Response(['status'=>404, 'message'=>'Tag not found', 'data'=>[], 'task'=>null, 'tag'=> null, 'myTaskColumn'=>[]  ], 400);

	}

	public function tagRemoveFromTask( WP_REST_Request $request)
	{

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$taskTagsTable = LAZYTASK_TABLE_PREFIX . 'task_tags';

		$requestData = $request->get_json_params();
		$tagName = sanitize_text_field($requestData['name']);
		$taskId = isset($requestData['task_id']) && $requestData['task_id'] != "" ? (int)$requestData['task_id'] : null;
		$userId = isset($requestData['user_id']) && $requestData['user_id'] != "" ? (int)$requestData['user_id'] : null;

		if($tagName){
			$tagObj = new Lazytask_TagController();
			$tag = $tagObj->tagGetOrCreate($requestData);
			if($tag && $taskId){
				$tagId = (int)$tag['id'];
				$existingTaskTag = $db->get_row($db->prepare("SELECT * FROM `{$wpdb->prefix}pms_task_tags` WHERE deleted_by IS NULL and deleted_at IS NULL and tag_id = %d and task_id = %d", $tagId, $taskId), ARRAY_A);
				if($existingTaskTag){
					$db->update(
						$taskTagsTable,
						array(
							"deleted_at" => current_time('mysql'),
							"deleted_by" => $userId,
						),
						array( 'id' => (int)$existingTaskTag['id'] )
					);
				}
				$task = $this->getTaskById($taskId);
				$taskTags = $task && isset($task['tags']) ? $task['tags'] : [];
				$myTaskColumn = [];
				if($task){
					$currentDate = gmdate('Y-m-d');
					$next7Days = gmdate('Y-m-d', strtotime($currentDate. ' + 7 days'));
					$myTaskColumn['all'] = $task;
					if($task['end_date'] < $currentDate){
						$task['my_task_section'] = 'overdue';
						$myTaskColumn['overdue'] = $task;
					}elseif($task['end_date'] == $currentDate){
						$task['my_task_section'] = 'today';
						$myTaskColumn['today'] = $task;
					}elseif($task['end_date'] > $currentDate && $task['end_date'] <= $next7Days){
						$task['my_task_section'] = 'nextSevenDays';
						$myTaskColumn['nextSevenDays'] = $task;
					}else{
						$task['my_task_section'] = 'upcoming';
						$myTaskColumn['upcoming'] = $task;
					}
				}
				return new WP_REST_Response(['status'=>200, 'message'=>'Tag remove successfully', 'data'=>$taskTags, 'task'=>$task, 'tag'=>$tag, 'myTaskColumn'=>$myTaskColumn ], 200);
			}

			return new WP_REST_Response(['status'=>200, 'message'=>'Tag remove successfully', 'data'=>[], 'task'=>null, 'tag'=>$tag, 'myTaskColumn'=>[] ], 200);
		}

		return new WP_REST_Response(['status'=>404, 'message'=>'Tag not found', 'data'=>[], 'task'=>null, 'tag'=>null, 'myTaskColumn'=>[] ], 400);

	}

	public function getTaskTagsByTaskId( $taskId )
	{

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$tagsTable = LAZYTASK_TABLE_PREFIX . 'tags';
		$taskTagsTable = LAZYTASK_TABLE_PREFIX . 'task_tags';

		// if (empty($tasksId)) {
		// 	return [];
		// }

		if(is_array($taskId)){
			$ids = implode(', ', array_fill(0, count($taskId), '%d'));
		}else{
			$ids = '%d';
			$taskId = [$taskId];
		}

		$sql = "SELECT taskTags.id as id, tags.id as tag_id, tags.name, taskTags.task_id
			FROM {$taskTagsTable} as taskTags
			JOIN {$tagsTable} as tags ON taskTags.tag_id=tags.id
			WHERE taskTags.deleted_at IS NULL AND taskTags.deleted_by IS NULL AND taskTags.task_id IN ($ids)";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $taskId));

		$results = $db->get_results( $query, ARRAY_A);
		$arrayReturn = [];
		if ($results){
			foreach ( $results as $result ) {
				$arrayReturn[$result['task_id']][] = [
					'id' => $result['id'],
					'tag_id' => $result['tag_id'],
					'name' => $result['name'],
					'task_id' => $result['task_id'],
				];
			}
		}

		return $arrayReturn;
	}



	public function getTasksByAssignedUserId( $userId, $requestData )
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$searchParms = isset($requestData['search']) && $requestData['search'] != "" ? sanitize_text_field($requestData['search']) : null;

		//search filter added by tasks name when search is not empty
		$searchFilter = '';
		if ( $searchParms ) {
			$search = '%' . $db->esc_like($searchParms) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}

		$allResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder, tasks.created_by as createdBy, tasks.privacy as taskPrivacy, 
       projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       taskSections.id as sectionId, taskSections.name as sectionName, taskSections.slug as sectionSlug,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       createdByUser.ID as createdById, createdByUser.display_name as createdByName, createdByUser.user_email as createdByEmail, createdByUser.user_login as createdByUsername,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
       internal_status.id as statusId, internal_status.name as statusName, internal_status.color_code as status_color_code, internal_status.sort_order as status_sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.serial_no as taskParentSerialNo, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
	FROM {$wpdb->prefix}pms_tasks as tasks
    JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    LEFT JOIN {$wpdb->prefix}users as createdByUser ON tasks.created_by = createdByUser.ID
   	LEFT JOIN {$wpdb->prefix}pms_task_sections as taskSections ON tasks.section_id = taskSections.id
    LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
    LEFT JOIN {$wpdb->prefix}pms_project_statuses as internal_status ON tasks.internal_status_id = internal_status.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
    WHERE tasks.deleted_at IS NULL AND assignedTo.ID = %d {$searchFilter} AND tasks.status = 'ACTIVE' AND taskSections.mark_is_complete = 'regular' order by tasks.serial_no ASC", $userId), ARRAY_A);

		$taskSerialSettings = get_option('lazytask_serial_settings', []);
		$isSerialEnabled = isset($taskSerialSettings['enabled']) ? $taskSerialSettings['enabled'] : false;

		$returnArray = null;
		if ($allResults){
			$parentResults = array_filter($allResults, function($item)  {
				return $item['parentId'] == '' && $item['parentId'] == null;
			});

			$tasksId = array_column($allResults, 'taskId');

			$taskMembers = $this->getTaskMembers($tasksId);

			// $taskComments = $this->getCommentsByTaskId($tasksId, 'task');

			// $taskActivityLogs = $this->getActivityLogsByTaskId($tasksId, 'task');

			// $taskAttachments = $this->getAttachmentsByTaskId($tasksId, 'task');

			$taskTags = $this->getTaskTagsByTaskId($tasksId);

			$childResults = array_filter($allResults, function($item)  {
				return $item['parentId'] != '' && $item['parentId'] != null;
			});

			$projectsId = array_unique(array_column($allResults, 'projectId'));

			$projectObj = new Lazytask_ProjectController();

			$projects = $projectObj->getProjectsByIds($projectsId);

			$childArray = [];
			if($childResults){
				foreach ($childResults as $value) {
					$parentId = $value['parentId'];
					$assignedTo = null;
					if($value['assignedToId']){
						$assignedTo = [
							'id' => $value['assignedToId'],
							'name' => $value['assignedToName'],
							'email' => $value['assignedToEmail'],
							'username' => $value['assignedToUsername'],
							'created_at' => $value['assignedToCreatedAt'],
							'avatar' => Lazytask_UserController::getUserAvatar($value['assignedToId']),
						];
					}
					$priority = null;
					if($value['priorityId']){
						$priority = [
							'id' => $value['priorityId'],
							'name' => $value['priorityName'],
							'project_id' => $value['projectId'],
							'color_code' => $value['color_code'],
							'sort_order' => $value['sort_order'],
						];
					}
					
					$status = null;
					if($value['statusId']){
						$priority = [
							'id' => $value['statusId'],
							'name' => $value['statusName'],
							'project_id' => $value['projectId'],
							'color_code' => $value['status_color_code'],
							'sort_order' => $value['status_sort_order'],
						];
					}

					$childArray[$parentId][] = [
						'id' => $value['taskId'],
						'task_section_id' => $value['sectionId'],
						'section_slug' => $value['sectionSlug'],
						'section_name' => trim($value['sectionName']),
						'project_id'=> $value['projectId'],
						'project'=> $projects && isset($projects[$value['projectId']]) ? $projects[$value['projectId']]:[],
						'is_serial_enable' => $isSerialEnabled,
						'task_serial_no' => $value['taskSerialNo'],
						'name' => $value['taskName'],
						'slug' => $value['taskSlug'],
						'description' => $value['taskDescription'],
						'sort_order' => $value['sortOrder'],
						'assigned_to' => $assignedTo,
						'assignedTo_id' => $value['assignedToId'],
						'start_date'=> $value['start_date'],
						'end_date'=> $value['end_date'],
						'start_date_is_visible' => $value['start_date_is_visible']==1,
						'end_date_is_visible' => $value['end_date_is_visible']==1,
						'status'=> $value['taskStatus'],
						'priority_id'=> $value['priorityId'],
						'priority'=> $priority,
						'internal_status_id'=> $value['statusId'],
						'internal_status'=> $status,
						'parent_id'=> $value['parentId']?: 0,
						'parent'=> [
							'id' => $value['taskParentId'],
							'name' => $value['taskParentName'],
							'slug' => $value['taskParentSlug'],
							'task_serial_no' => $value['taskParentSerialNo'],
							'description' => $value['taskParentDescription']
						],
						'created_at'=> $value['taskCreatedAt'],
						'createdBy_id'=> $value['createdBy'],
						'createdBy_name'=> $value['createdByName'],
						'taskPrivacy'=> $value['taskPrivacy'],
						'updated_at'=> $value['taskUpdatedAt'],
						'members' => isset($taskMembers[ $value['taskId'] ]) ? $taskMembers[ $value['taskId'] ] :[],
						// 'comments' => isset($taskComments[ $value['taskId'] ]) && sizeof($taskComments[ $value['taskId'] ]) > 0 ? $taskComments[ $value['taskId'] ] :[],
						// 'logActivities' => isset($taskActivityLogs[ $value['taskId'] ]) && sizeof($taskActivityLogs[ $value['taskId'] ]) > 0 ? $taskActivityLogs[ $value['taskId'] ] :[],
						// 'attachments' => isset($taskAttachments[ $value['taskId'] ]) && sizeof($taskAttachments[ $value['taskId'] ]) > 0 ? $taskAttachments[ $value['taskId'] ] :[],
						'tags' => isset($taskTags[ $value['taskId'] ]) && sizeof($taskTags[ $value['taskId'] ]) > 0 ? $taskTags[ $value['taskId'] ] :[],
					];

				}
			}

			foreach ( $parentResults as $key => $result ) {

				$assignedTo = null;
				if($result['assignedToId']){
					$assignedTo = [
						'id' => $result['assignedToId'],
						'name' => $result['assignedToName'],
						'email' => $result['assignedToEmail'],
						'username' => $result['assignedToUsername'],
						'created_at' => $result['assignedToCreatedAt'],
						'avatar' => Lazytask_UserController::getUserAvatar($result['assignedToId']),
					];
				}
				$project = null;

				$priority = null;
				if($result['priorityId']){
					$priority = [
						'id' => $result['priorityId'],
						'name' => $result['priorityName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['color_code'],
						'sort_order' => $result['sort_order'],
					];
				}
				
				$status = null;
				if($result['statusId']){
					$status = [
						'id' => $result['statusId'],
						'name' => $result['statusName'],
						'project_id' => $result['projectId'],
						'color_code' => $result['status_color_code'],
						'sort_order' => $result['status_sort_order'],
					];
				}

				$returnArray['data'][] = [
					'id' => $result['taskId'],
					'project_id'=> $result['projectId'],
					'project'=> $projects && isset($projects[$result['projectId']]) ? $projects[$result['projectId']]:[],
					'task_section_id' => $result['sectionId'],
					'section_slug' => $result['sectionSlug'],
					'section_name' => trim($result['sectionName']),
					'is_serial_enable' => $isSerialEnabled,
					'task_serial_no' => $result['taskSerialNo'],
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'sort_order' => $result['sortOrder'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible'] == 1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['statusId'],
					'internal_status'=> $status,
					'parent_id'=> $result['parentId']?: 0,
					'parent'=> null,
					'created_at'=> $result['taskCreatedAt'],
					'createdBy_id'=> $result['createdBy'],
					'createdBy_name'=> $result['createdByName'],
					'taskPrivacy'=> $result['taskPrivacy'],
					'updated_at'=> $result['taskUpdatedAt'],
					'members' => isset($taskMembers[ $result['taskId'] ]) ? $taskMembers[ $result['taskId'] ] :[],
					'children' => isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[],
					// 'comments' => isset($taskComments[ $result['taskId'] ]) && sizeof($taskComments[ $result['taskId'] ]) > 0 ? $taskComments[ $result['taskId'] ] :[],
					// 'logActivities' => isset($taskActivityLogs[ $result['taskId'] ]) && sizeof($taskActivityLogs[ $result['taskId'] ]) > 0 ? $taskActivityLogs[ $result['taskId'] ] :[],
					// 'attachments' => isset($taskAttachments[ $result['taskId'] ]) && sizeof($taskAttachments[ $result['taskId'] ]) > 0 ? $taskAttachments[ $result['taskId'] ] :[],
					'tags' => isset($taskTags[ $result['taskId'] ]) && sizeof($taskTags[ $result['taskId'] ]) > 0 ? $taskTags[ $result['taskId'] ] :[],
				];


				$returnArray['childData'][$result['taskSlug']] = isset($childArray[ $result['taskId'] ]) && sizeof($childArray[ $result['taskId'] ])>0 ? $childArray[ $result['taskId'] ] :[];
			}
		}
		return $returnArray;
	}

	public function getQuickTaskByUserId($userId)
	{

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);


		$allResults = $db->get_results($db->prepare("SELECT * FROM {$wpdb->prefix}pms_quick_tasks as quick_tasks
         JOIN {$wpdb->prefix}users as users ON quick_tasks.user_id = users.ID
		 WHERE quick_tasks.status=1 AND quick_tasks.user_id = %d order by quick_tasks.sort_order ASC", (int)$userId), ARRAY_A);
		$returnArray = [];
		if($allResults){
			foreach ($allResults as $result) {
				$returnArray[] = [
					'id' => $result['id'],
					'name' => $result['name'],
					'user_id' => $result['user_id'],
					'user_name' => $result['display_name'],
					'sort_order' => $result['sort_order'],
					'status' => $result['status'],
					'created_at' => $result['created_at'],
					'updated_at' => $result['updated_at'],
				];
			}
		}
		return $returnArray;
	}

	public function getQuickTaskById( $id )
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$tasksTable = LAZYTASK_TABLE_PREFIX . 'quick_tasks';
		$userTable = $wpdb->prefix . 'users';

		$row = $db->get_row($db->prepare("SELECT * FROM {$tasksTable} as quick_tasks
		 JOIN {$userTable} as users ON quick_tasks.user_id = users.ID
		 WHERE quick_tasks.id = %d", (int)$id), ARRAY_A);
		if($row){
			return [
				'id' => $row['id'],
				'name' => $row['name'],
				'user_id' => $row['user_id'],
				'user_name' => $row['display_name'],
				'sort_order' => $row['sort_order'],
				'status' => $row['status'],
				'created_at' => $row['created_at'],
				'updated_at' => $row['updated_at'],
			];
		}
		return null;

	}

	public function quickTaskCreate(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$name = sanitize_text_field($requestData['name']);
		$userId = isset($requestData['user_id']) && $requestData['user_id'] != "" ? (int)$requestData['user_id'] : null;
		$created_at = current_time('mysql');
//		return new WP_REST_Response(['status'=>200, 'message'=>'Quick task created successfully', 'data'=>$requestData ], 200);

		if (empty($name)) {
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}

		if(empty($userId)){
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}

		$db->query('START TRANSACTION');

		$tableName = LAZYTASK_TABLE_PREFIX . 'quick_tasks';
		$quickTaskInserted = $db->insert(
			$tableName,
			array(
				"name" => $name,
				"user_id" => $userId,
				"created_at" => $created_at,
			)
		);

		if (!$quickTaskInserted) {
			$db->query('ROLLBACK');
			return new WP_Error('db_insert_error', 'Could not insert quick task into the database.', array('status' => 500));
		}

		$quickTaskId = $wpdb->insert_id;

		$db->query('COMMIT');

		$quickTask = $this->getQuickTaskById($quickTaskId);
		if($quickTask){
			return new WP_REST_Response(['status'=>200, 'message'=>'Quick task created successfully', 'data'=>$quickTask ], 200);
		}
		return new WP_Error('not_found', 'Quick task not found.', array('status' => 404));

	}

	//delete quick task
	public function quickTaskDelete(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$id = $request->get_param('id');
        $userId = $request->get_param('deleted_by');

		$quickTask = $this->getQuickTaskById($id);
		if($quickTask){
			$tableName = LAZYTASK_TABLE_PREFIX . 'quick_tasks';
			$db->delete($tableName, array('id' => $id));
			return new WP_REST_Response(['status'=>200, 'message'=>'Quick task removed successfully', 'data'=>['id'=>$id], 'loggedUserID'=>$userId ], 200);
		}
		return new WP_Error('not_found', 'Quick task not found.', array('status' => 404));
	}

	public function getDashboardTaskCount(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$taskTable = $wpdb->prefix . 'pms_tasks';
		$projectTable = $wpdb->prefix . 'pms_projects';

		$currentDate = gmdate('Y-m-d');

		$sql = $db->prepare(
			"SELECT 
				SUM(CASE WHEN tasks.status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') THEN 1 ELSE 0 END) AS total_tasks,
				SUM(CASE WHEN tasks.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_tasks,
				SUM(CASE WHEN tasks.status != 'COMPLETED' 
						AND tasks.status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') 
						AND tasks.end_date < %s THEN 1 ELSE 0 END) AS overdue_tasks,
				SUM(CASE WHEN tasks.status IN ('ARCHIVED_A', 'ARCHIVED_C') THEN 1 ELSE 0 END) AS archived_tasks
			FROM {$taskTable} tasks
			LEFT JOIN {$projectTable} projects ON projects.id = tasks.project_id
			WHERE tasks.deleted_at IS NULL 
			AND tasks.project_id IS NOT NULL 
			AND projects.status = 1",
			$currentDate
		);

		$result = $db->get_row($sql);

		$pending_tasks = $result->total_tasks - $result->completed_tasks - $result->overdue_tasks;

		$total_tasks_percentage = $result->total_tasks > 0 ? round(($result->total_tasks / $result->total_tasks) * 100, 2) : 0;
		$completed_tasks_percentage = $result->completed_tasks > 0 ? round(($result->completed_tasks / $result->total_tasks) * 100, 2) : 0;
		$overdue_tasks_percentage = $result->overdue_tasks > 0 ? round(($result->overdue_tasks / $result->total_tasks) * 100, 2) : 0;
		$pending_tasks_percentage = $pending_tasks > 0 ? round(($pending_tasks / $result->total_tasks) * 100, 2) : 0;
		
		// === PER PROJECT CLASSIFICATION ===
		$sqlProjects = $db->prepare(
			"SELECT 
				p.id as project_id,
				p.name as project_name,
				SUM(CASE WHEN t.status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') THEN 1 ELSE 0 END) as total_tasks,
				SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
				SUM(CASE WHEN t.status != 'COMPLETED' 
						AND t.status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') 
						AND t.end_date < %s THEN 1 ELSE 0 END) as overdue_tasks,
				SUM(CASE WHEN t.status IN ('ARCHIVED_A', 'ARCHIVED_C') THEN 1 ELSE 0 END) as archived_tasks
			FROM {$taskTable} t
			LEFT JOIN {$projectTable} p ON p.id = t.project_id
			WHERE t.deleted_at IS NULL AND p.id IS NOT NULL AND p.status = 1
			GROUP BY p.id",
			$currentDate
		);

		$projects = $db->get_results($sqlProjects);

		// === Unique Colors for Projects ===
		$colorPalette = [
			"#FF5733", "#33FF57", "#3357FF", "#F1C40F", "#8E44AD",
			"#16A085", "#E67E22", "#2C3E50", "#D35400", "#27AE60",
			"#2980B9", "#C0392B", "#7F8C8D", "#9B59B6", "#1ABC9C",
			"#34495E", "#E74C3C", "#95A5A6", "#F39C12", "#2ECC71"
		];

		shuffle($colorPalette);

		$projectsData = [];
		$i = 0;
		foreach ($projects as $proj) {
			$projectsData[] = [
				'project_id'   => (int)$proj->project_id,
				'project_name' => $proj->project_name,
				'color'        => $colorPalette[$i] ?? sprintf("#%06X", mt_rand(0, 0xFFFFFF)),

				// Absolute numbers
				'total_tasks'      => (int)$proj->total_tasks,
				'completed_tasks'  => (int)$proj->completed_tasks,
				'overdue_tasks'    => (int)$proj->overdue_tasks,
				'archived_tasks'    => (int)$proj->archived_tasks,
				'active_tasks'     => (int)($proj->total_tasks - ($proj->completed_tasks + $proj->overdue_tasks)),

				// Percentages relative to GLOBAL total
				'total_tasks_percentage'     => $result->total_tasks > 0 ? round(($proj->total_tasks / $result->total_tasks) * 100, 2) : 0,
				'completed_tasks_percentage' => $result->completed_tasks > 0 ? round(($proj->completed_tasks / $result->total_tasks) * 100, 2) : 0,
				'overdue_tasks_percentage'   => $result->overdue_tasks > 0 ? round(($proj->overdue_tasks / $result->total_tasks) * 100, 2) : 0,
				'active_tasks_percentage'    => $pending_tasks > 0 ? round((($proj->total_tasks - $proj->completed_tasks - $proj->overdue_tasks) / $result->total_tasks) * 100, 2) : 0,
			];
			$i++;
		}

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Success',
			'data' => [
				'total_tasks' => (int)$result->total_tasks,
				'completed_tasks' => (int)$result->completed_tasks, 
				'overdue_tasks' => (int)$result->overdue_tasks,
				'pending_tasks' => (int)$pending_tasks,
				'archived_tasks' => (int)$result->archived_tasks,
				'total_tasks_percentage' => $total_tasks_percentage,
				'completed_tasks_percentage' => $completed_tasks_percentage,
				'overdue_tasks_percentage' => $overdue_tasks_percentage,
				'pending_tasks_percentage' => $pending_tasks_percentage,
				'projectsData' => $projectsData,
			]
		], 200);
	}

	public function getTotalTaskCountPerProject()
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$taskTable = $wpdb->prefix . 'pms_tasks';
		$projectTable = $wpdb->prefix . 'pms_projects';

		$sql = "
			SELECT 
				p.id AS project_id,
				p.name AS project_name,
				SUM(CASE 
					WHEN t.status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') 
					THEN 1 ELSE 0 
				END) AS total_tasks,
				SUM(CASE 
					WHEN t.status = 'COMPLETED' 
					THEN 1 ELSE 0 
				END) AS completed_tasks,
				SUM(CASE 
					WHEN t.status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') 
						AND t.assigned_to IS NOT NULL 
					THEN 1 ELSE 0 
				END) AS total_assigned_tasks,
				SUM(CASE 
					WHEN t.status NOT IN ('ARCHIVED_A', 'ARCHIVED_C')
						AND (t.status IS NOT NULL OR t.status != 'COMPLETED')
						AND t.end_date IS NOT NULL 
						AND t.end_date < NOW() 
					THEN 1 ELSE 0 
				END) AS overdue_tasks

			FROM {$taskTable} t
			INNER JOIN {$projectTable} p ON p.id = t.project_id
			WHERE t.deleted_at IS NULL AND p.status = 1
			GROUP BY p.id
		";

		$projects = $db->get_results($sql, ARRAY_A);

		$result = [];
		foreach ($projects as $proj) {
			$result[$proj['project_id']] = $proj;
		}

		return $result;
	}


	// Function for get dashboard members task count by project
	public function getMembersTaskCount(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$taskTable = $wpdb->prefix . 'pms_tasks';
		$projectTable = $wpdb->prefix . 'pms_projects';
		$projectMembersTable = $wpdb->prefix . 'pms_projects_users';

		$userId = $request->get_param('id');
		if(empty($userId)){
			$allProjects = $db->get_results(
				"SELECT id, name 
				FROM {$projectTable}
				WHERE status = '1' 
				AND deleted_at IS NULL 
				ORDER BY id ASC",
				ARRAY_A
			);
		}else{

			$allProjects = $db->get_results($db->prepare(
				"SELECT project.id, project.name FROM {$projectTable} as project 
				LEFT JOIN {$projectMembersTable} as members ON project.id = members.project_id
				WHERE members.user_id = %d AND project.status='1' AND project.deleted_at IS NULL 
				ORDER BY project.id ASC",
				$userId
			), ARRAY_A);
		}

		$returnArray = [];
		$currentDate = gmdate('Y-m-d');

		foreach ($allProjects as $project) {
			$projectId = $project['id'];
			
			$projectController = new Lazytask_ProjectController();
			$projectMembers = $projectController->getProjectMembers($projectId);
			
			$membersData = [];

			$flatMembers = array_reduce($projectMembers, 'array_merge', []);

        	foreach ($flatMembers as $member) {
				$memberId = $member['id'];

				$sql = $db->prepare(
					"SELECT 
						SUM(CASE WHEN status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') THEN 1 ELSE 0 END) as total_tasks,
						SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
						SUM(CASE WHEN status != 'COMPLETED' AND status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') AND end_date < %s THEN 1 ELSE 0 END) as overdue_tasks,
						SUM(CASE WHEN status IN ('ARCHIVED_A', 'ARCHIVED_C') THEN 1 ELSE 0 END) as archived_tasks
					FROM {$taskTable} tasks
					WHERE deleted_at IS NULL AND project_id = %d AND assigned_to = %d",
					$currentDate, $projectId, $memberId
				);

				$tasks = $db->get_row($sql);

				$completed = intval($tasks->completed_tasks);
				$archived  = intval($tasks->archived_tasks);
				$total     = intval($tasks->total_tasks);
				$overdue   = intval($tasks->overdue_tasks);
				$active    = $total - ($completed + $overdue);

				$membersData[] = [
					'id' => $memberId,
					'name' => $member['name'] ?? ($member['display_name'] ?? ''),
					'avatar' => Lazytask_UserController::getUserAvatar($memberId),
					'total_tasks' => $total,
					'completed_tasks' => $completed,
					'overdue_tasks' => $overdue,
					'active_tasks' => $active,
				];
			}
			$total_tasks = intval($this->getTotalTaskCountPerProject()[$projectId]['total_tasks'] ?? 0);
			$total_assigned_tasks = intval($this->getTotalTaskCountPerProject()[$projectId]['total_assigned_tasks'] ?? 0);
			$completed_tasks = intval($this->getTotalTaskCountPerProject()[$projectId]['completed_tasks'] ?? 0);
			$overdue_tasks = intval($this->getTotalTaskCountPerProject()[$projectId]['overdue_tasks'] ?? 0);
			$active_tasks = $total_tasks - ($completed_tasks + $overdue_tasks);
			$returnArray[] = [
				'id' => $projectId,
				'name' => $project['name'],
				'members' => $membersData,
				'member_count' => count($membersData),
				'total_tasks' => $total_tasks,
				'total_assigned_tasks' => $total_assigned_tasks,
				'overdue_tasks' => $overdue_tasks,
				'active_tasks' => $active_tasks,
			];
		}

		return new WP_REST_Response(['status'=>200, 'message'=>'Data fetched successfully', 'data'=>$returnArray ], 200);
	}

	public function getProjectPriorityTaskCount(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$taskTable = $wpdb->prefix . 'pms_tasks';
		$projectTable = $wpdb->prefix . 'pms_projects';
		$projectMembersTable = $wpdb->prefix . 'pms_projects_users';
		$projectPrioritiesTable = $wpdb->prefix . 'pms_project_priorities';
		$projectStatusesTable = $wpdb->prefix . 'pms_project_statuses';

		$userId = $request->get_param('id');

		if(empty($userId)){
			$allProjects = $db->get_results(
				"SELECT id, name 
				FROM {$projectTable}
				WHERE status = '1' 
				AND deleted_at IS NULL 
				ORDER BY id ASC",
				ARRAY_A
			);

		}else{
			$allProjects = $db->get_results($db->prepare(
				"SELECT project.id, project.name FROM {$projectTable} as project 
				INNER JOIN {$projectMembersTable} as members ON project.id = members.project_id
				WHERE members.user_id = %d AND project.status='1' AND project.deleted_at IS NULL 
				ORDER BY project.id ASC",
				$userId
			), ARRAY_A);
		}

		$returnArray = [];
		$currentDate = gmdate('Y-m-d');

		foreach ($allProjects as $project) {
			$projectId = $project['id'];

			$priorities = $db->get_results($db->prepare("SELECT id, name, color_code FROM {$projectPrioritiesTable} WHERE project_id = %d ORDER BY sort_order ASC", $projectId), ARRAY_A);
			if (!$priorities) {
				continue; // Skip projects without priorities
			}

			$prioritiesData = [];
			foreach ($priorities as $priority) {
				$priorityId = $priority['id'];

				$sql = $db->prepare(
					"SELECT COUNT(*) as task_count
					FROM {$taskTable}
					WHERE deleted_at IS NULL
					AND project_id = %d
					AND priority_id = %d
					AND status IN ('ACTIVE', 'COMPLETED')",
					$projectId, $priorityId
				);

				$tasks = $db->get_row($sql);

				$prioritiesData[] = [
					'priority_id' => $priorityId,
					'priority_name' => $priority['name'],
					'color_code' => $priority['color_code'],
					'task_count' => intval($tasks->task_count),
				];
			}

			$statuses = $db->get_results($db->prepare("SELECT id, name, color_code FROM {$projectStatusesTable} WHERE project_id = %d ORDER BY sort_order ASC", $projectId), ARRAY_A);
			$statusesData = [];
			foreach ($statuses as $status) {
				$statusId = $status['id'];
				
				$sql = $db->prepare(
					"SELECT COUNT(*) as task_count
					FROM {$taskTable}
					WHERE deleted_at IS NULL
					AND project_id = %d
					AND internal_status_id = %d
					AND status IN ('ACTIVE', 'COMPLETED')",
					$projectId, $statusId
				);

				$status_tasks = $db->get_row($sql);

				$statusesData[] = [
					'stauts_id' => $statusId,
					'status_name' => $status['name'],
					'color_code' => $status['color_code'],
					'task_count' => intval($status_tasks->task_count),
				];
			}

			$returnArray[] = [
				'id' => $projectId,
				'name' => $project['name'],
				'priorities' => $prioritiesData,
				'statuses' => $statusesData,
			];

		}

		return new WP_REST_Response(['status'=>200, 'message'=>'Data fetched successfully', 'data'=>$returnArray ], 200);
	}

	// function for user tasks by date
	public function getUserTasksByDate(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$taskTable = $wpdb->prefix . 'pms_tasks';
		$priorityTable = $wpdb->prefix . 'pms_project_priorities';
		$projectTable = $wpdb->prefix . 'pms_projects';

		$requestData = $request->get_json_params();
		$userId = $request->get_param('id');
		$date = $request->get_param('date');

		// $date = isset($requestData['date']) && $requestData['date'] != "" ? sanitize_text_field($requestData['date']) : null;

		if(empty($userId) || empty($date)){
			return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
		}

		$allResults = $db->get_results(
			$db->prepare(
				"SELECT task.*, priority.name as priority_name, priority.color_code as priority_color_code
				FROM {$taskTable} as task
				LEFT JOIN {$projectTable} as project ON task.project_id = project.id
				LEFT JOIN {$priorityTable} as priority ON task.priority_id = priority.id
				WHERE task.deleted_at IS NULL AND project.status = 1
				AND task.status IN ('ACTIVE', 'COMPLETED')
				AND task.assigned_to = %d 
				AND (task.start_date = %s OR task.end_date = %s) 
				ORDER BY task.start_date ASC, task.end_date ASC",
				(int)$userId,
				$date,
				$date
			),
			ARRAY_A
		);

		$returnArray = [];
		if($allResults){
			foreach ($allResults as $result) {
				$returnArray[] = [
					'id' => $result['id'],
					'project_id' => $result['project_id'],
					'name' => $result['name'],
					'description' => $result['description'],
					'start_date' => $result['start_date'],
					'end_date' => $result['end_date'],
					'status' => $result['status'],
					'priority_id' => $result['priority_id'],
					'priority_name' => $result['priority_name'],
					'priority_color_code' => $result['priority_color_code'],
					'internal_status_id' => $result['internal_status_id'],
					'assigned_to' => $result['assigned_to'],
					'created_by' => $result['created_by'],
					'created_at' => $result['created_at'],
					'updated_at' => $result['updated_at'],
				];
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Data fetched successfully', 'data'=>$returnArray ], 200);
		}
		return new WP_REST_Response(['status'=>200, 'message'=>'No tasks found', 'data'=>[] ], 200);
	}

	public function uploadAttachment(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		// Sanitize and validate the input data
		$requestData = $request->get_body_params();
		$requestFileData = $request->get_file_params();

		$userId = $requestData['user_id'];
		$file_upload_response=[];

		if($userId && $requestFileData){
			require_once(ABSPATH . 'wp-admin/includes/file.php');
			require_once(ABSPATH . 'wp-admin/includes/image.php');
			if($requestFileData && sizeof($requestFileData)>0){

				foreach ( $requestFileData as $file){
					$upload_overrides = array('test_form' => false);

					$moveFile = wp_handle_upload($file, $upload_overrides);

					if($moveFile){
						$attachment = array(
							'post_author' => $userId,
							'post_title' => $file['name'],
							'post_content' => '',
							'post_status' => 'inherit',
							'post_mime_type' => image_type_to_mime_type(exif_imagetype($moveFile['file']))
						);

						$attachment_id = wp_insert_attachment($attachment, $moveFile['file']);

						$attach_data = wp_generate_attachment_metadata($attachment_id, $moveFile['file']);
						wp_update_attachment_metadata($attachment_id, $attach_data);

						if($attachment_id){

							$file_upload_response[] = [
								'id' => $attachment_id,
								'name' => $file['name'],
								'url' => $moveFile['url'],
								'type' => $file['type'],
								'file_name'=> $file['name'] ?? null,
								'file_path'=> $moveFile['url'] ?? null,
								'mine_type' => $file['type'] ?? null,
								'size' => $file['size'] ?? null,
								'wp_attachment_id' => $attachment_id,
							];
						}
					}

				}

			}

			return new WP_REST_Response(['status'=>200, 'message'=>'Attachment upload successfully', 'data'=>$file_upload_response ], 200);

		}
		return new WP_Error('not_found', 'Task not found.', array('status' => 404));
	}

	public function removeAttachment(WP_REST_Request $request)
	{

		$id = $request->get_param('id');

		$attachment = wp_get_attachment_image($id);

		if($attachment){

			wp_delete_attachment($id, true);

			return new WP_REST_Response(['status'=>200, 'message'=>'Attachment remove successfully' ], 200);
		}

		return new WP_Error('not_found', 'Attachment not found.', array('status' =>''));
	}

	public function mergeTaskCommentsAndLogActivities( $comments, $logActivities )
	{

		$mergedArray = array_merge($comments, $logActivities);

	    usort($mergedArray, function ($a, $b) {
			return strtotime($b['created_at']) - strtotime($a['created_at']);	
		});

	   return $mergedArray;

	}

	// public function updateGanttTaskSortOrder(WP_REST_Request $request)
	// {
	// 	global $wpdb;

	// 	$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

	// 	$tableTasks = LAZYTASK_TABLE_PREFIX . 'tasks_for_gantt';


	// 	$requestData = $request->get_json_params();

	// 	$project_id = $requestData['project_id'];
	// 	$orderedList = $requestData['orderedList'];
	// 	$updated_at = current_time('mysql');
	// 	if(!$project_id){
	// 		return new WP_Error('required_fields', 'Please ensure all required fields are provided.', array('status' => 400));
	// 	}

	// 	if( sizeof($orderedList) > 0 ){
	// 		$db->query('START TRANSACTION');

	// 		$caseStatements = [];
	// 		$taskIds = [];

	// 		foreach ($orderedList as $key => $task) {
	// 			$taskId = (int)$task;
	// 			$sortOrder = $key + 1;
	// 			$caseStatements[] = $wpdb->prepare("WHEN task_id = %d THEN %d", $taskId, $sortOrder);
	// 			$taskIds[] = $taskId;
	// 		}

	// 		$caseQuery = implode(' ', $caseStatements);
	// 		$taskIdsPlaceholders = implode(',', array_fill(0, count($taskIds), '%d'));

	// 		$sql = $wpdb->prepare(
	// 			"UPDATE {$tableTasks}
	// 			SET sort_order = CASE {$caseQuery} END,
	// 				updated_at = %s
	// 			WHERE task_id IN ($taskIdsPlaceholders) AND project_id = %d",
	// 						array_merge([$updated_at], $taskIds, [(int)$project_id])
	// 					);

	// 		$db->query($sql);


	// 		$db->query('COMMIT');
	// 		return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $orderedList], 200);

	// 	}

	// 	return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => []], 200);

	// }

	public function getGanttTasksByProjectId($projectId, $requestData)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		//search filter added by tasks name when search is not empty
		$searchFilter = '';
		if (isset($requestData['search']) && $requestData['search'] != '') {
			$search = '%' . $db->esc_like($requestData['search']) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}

		if (isset($requestData['name']) && $requestData['name'] != '') {
			$search = '%' . $db->esc_like($requestData['name']) . '%';
			$searchFilter = $db->prepare(" AND tasks.name LIKE %s", $search);
		}
		if( isset($requestData['section_id']) && $requestData['section_id'] != '' ){
			$sectionId = $requestData['section_id'];
			$searchFilter .= $db->prepare(" AND tasks.section_id = %d", (int)$sectionId);
		}
		//assigned_to search
		if (isset($requestData['assigned_to']) && $requestData['assigned_to'] != '') {
			$assignedToId = $requestData['assigned_to'];
			$searchFilter .= $db->prepare(" AND tasks.assigned_to = %d", (int)$assignedToId);
		}
		//priority_id
		if (isset($requestData['priority_id']) && $requestData['priority_id'] != '') {
			$priorityId = $requestData['priority_id'];
			$searchFilter .= $db->prepare(" AND tasks.priority_id = %d", (int)$priorityId);
		}
		//internal_status_id
		if (isset($requestData['internal_status_id']) && $requestData['internal_status_id'] != '') {
			$internalStatusId = $requestData['internal_status_id'];
			$searchFilter .= $db->prepare(" AND tasks.internal_status_id = %d", (int)$internalStatusId);
		}

		//date_type search
		if (isset($requestData['date_type']) && $requestData['date_type'] != '') {
			$dateType = $requestData['date_type'];
			if ($dateType == 'today') {
				$currentDate = gmdate('Y-m-d');
				$searchFilter .= $db->prepare(" AND DATE(tasks.end_date) = %s", $currentDate);
			} elseif ($dateType == 'next_seven_days') {
				$nextSevenDays = gmdate('Y-m-d', strtotime('+7 days'));
				$searchFilter .= $db->prepare(" AND tasks.end_date BETWEEN %s AND %s", gmdate('Y-m-d'), $nextSevenDays);
			} elseif ($dateType == 'upcoming') {
				$searchFilter .= $db->prepare(" AND tasks.end_date > %s", gmdate('Y-m-d'));
			} elseif ($dateType == 'overdue') {
				$searchFilter .= $db->prepare(" AND tasks.end_date < %s", gmdate('Y-m-d'));
			} elseif ($dateType == 'no-date') {
				$searchFilter .= " AND  tasks.end_date IS NULL";
			}
		}

		// $limit = isset($requestData['limit']) ? (int)$requestData['limit'] : 15;
		// $offset = isset($requestData['offset']) ? (int)$requestData['offset'] : 0;

		$allResults = $db->get_results($db->prepare("SELECT tasks.id as taskId, tasks.serial_no as taskSerialNo, tasks.name as taskName, tasks.slug as taskSlug, tasks.description as taskDescription, tasks.status as taskStatus, tasks.created_at as taskCreatedAt, tasks.updated_at as taskUpdatedAt, tasks.start_date as start_date, tasks.end_date as end_date, tasks.start_date_is_visible, tasks.end_date_is_visible, tasks.parent_id as parentId, tasks.sort_order as sortOrder, tasks.section_id as sectionId, 
       tasks.is_visible_on_gantt as ganttIsVisible, projects.company_id as companyId, projects.id as projectId, projects.name as projectName, projects.code as projectCode, projects.slug as projectSlug, projects.status as projectStatus, 
       createdBy.ID as createdBy_id, createdBy.display_name as createdBy_name, createdBy.user_email as createdBy_email,
       assignedTo.ID as assignedToId, assignedTo.display_name as assignedToName, assignedTo.user_email as assignedToEmail, assignedTo.user_login as assignedToUsername, assignedTo.user_registered as assignedToCreatedAt,
       priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order,
       internal_status.id as statusId, internal_status.name as statusName, internal_status.color_code as status_color_code, internal_status.sort_order as status_sort_order,
	   taskParent.id as taskParentId, taskParent.name as taskParentName, taskParent.slug as taskParentSlug, taskParent.description as taskParentDescription, taskParent.status as taskParentStatus, taskParent.created_at as taskParentCreatedAt, taskParent.sort_order as parentSortOrder
FROM {$wpdb->prefix}pms_tasks as tasks
    JOIN {$wpdb->prefix}pms_projects as projects ON tasks.project_id = projects.id
    JOIN {$wpdb->prefix}users as createdBy ON tasks.created_by = createdBy.ID
    LEFT JOIN {$wpdb->prefix}users as assignedTo ON tasks.assigned_to = assignedTo.ID
    LEFT JOIN {$wpdb->prefix}pms_project_priorities as priority ON tasks.priority_id = priority.id
    LEFT JOIN {$wpdb->prefix}pms_project_statuses as internal_status ON tasks.internal_status_id = internal_status.id
	LEFT JOIN {$wpdb->prefix}pms_tasks as taskParent ON tasks.parent_id = taskParent.id
         WHERE tasks.deleted_at IS NULL AND tasks.is_visible_on_gantt = 1 AND projects.id = %d {$searchFilter} AND tasks.status = 'ACTIVE' order by tasks.sort_order ASC", (int)$projectId), ARRAY_A);

		$returnArray = null;
		if ($allResults){
			$childResults = array_filter($allResults, fn($item) => !empty($item['parentId']));

			$children = [];
			if ($childResults) {
				foreach ($childResults as $value) {
					$parentId = $value['parentId'];

					$assignedTo = !empty($value['assignedToId']) ? [
						'id' => $value['assignedToId'],
						'name' => $value['assignedToName'],
						'email' => $value['assignedToEmail'],
						'username' => $value['assignedToUsername'],
						'created_at' => $value['assignedToCreatedAt'],
						'avatar' => Lazytask_UserController::getUserAvatar($value['assignedToId']),
					] : null;

					$priority = !empty($value['priorityId']) ? [
						'id' => $value['priorityId'],
						'name' => $value['priorityName'],
						'project_id' => $value['projectId'],
						'color_code' => $value['color_code'],
						'sort_order' => $value['sort_order'],
					] : null;

					$status = !empty($value['statusId']) ? [
						'id' => $value['statusId'],
						'name' => $value['statusName'],
						'project_id' => $value['projectId'],
						'color_code' => $value['status_color_code'],
						'sort_order' => $value['status_sort_order'],
					] : null;

					$children[$parentId][] = [
						'id' => $value['taskId'],
						'task_section_id' => $value['sectionId'],
						'name' => $value['taskName'],
						'slug' => $value['taskSlug'],
						'description' => $value['taskDescription'],
						'sort_order' => $value['sortOrder'],
						'assigned_to' => $assignedTo,
						'assignedTo_id' => $value['assignedToId'],
						'start_date' => $value['start_date'],
						'end_date' => $value['end_date'],
						'start_date_is_visible' => (bool)$value['start_date_is_visible'],
						'end_date_is_visible' => (bool)$value['end_date_is_visible'],
						'status' => $value['taskStatus'],
						'priority_id' => $value['priorityId'],
						'priority' => $priority,
						'internal_status_id' => $value['statusId'],
						'internal_status' => $status,
						'parent_id' => $parentId ?: 0,
						'parent' => [
							'id' => $value['taskParentId'],
							'name' => $value['taskParentName'],
							'slug' => $value['taskParentSlug'],
							'description' => $value['taskParentDescription'],
						],
					];
				}
			}

			$groupedMap=[];
			foreach ( $allResults as $result ) {

				$parent = !empty($result['parentId']) ? [
					'id' => $result['taskParentId'],
					'name' => $result['taskParentName'],
					'slug' => $result['taskParentSlug'],
					'description' => $result['taskParentDescription']
				] : null;

				$assignedTo = !empty( $result['assignedToId']) ? [
					'id' => $result['assignedToId'],
					'name' => $result['assignedToName'],
					'email' => $result['assignedToEmail'],
					'username' => $result['assignedToUsername'],
					'created_at' => $result['assignedToCreatedAt'],
					'avatar' => Lazytask_UserController::getUserAvatar($result['assignedToId']),
				] : null;

				$priority = !empty( $result['priorityId']) ? [
					'id' => $result['priorityId'],
					'name' => $result['priorityName'],
					'project_id' => $result['projectId'],
					'color_code' => $result['color_code'],
					'sort_order' => $result['sort_order'],
				] : null;

				$status = !empty( $result['statusId']) ? [
					'id' => $result['statusId'],
					'name' => $result['statusName'],
					'project_id' => $result['projectId'],
					'color_code' => $result['status_color_code'],
					'sort_order' => $result['status_sort_order'],
				] : null;

				list( $start, $end, $isMissing, $durationDay ) = $this->ganttChartStartDateEndDate( $result['start_date'], $result['end_date'] );

				$isSubtask = $result['parentId'] ? true : false;

				$parentOrOriginalTaskId = $result['parentId'] ?: $result['taskId'];

				$groupedMap[$parentOrOriginalTaskId][]= [
					'id' => $result['taskId'],
					'createdBy_id' => $result['createdBy_id'],
					'createdBy_name' => $result['createdBy_name'],
					'project_id'=> $result['projectId'],
					'task_section_id' => $result['sectionId'],
					'name' => $result['taskName'],
					'slug' => $result['taskSlug'],
					'description' => $result['taskDescription'],
					'sort_order' => $result['sortOrder'],
					'assigned_to' => $assignedTo,
					'assignedTo_id' => $result['assignedToId'],
					'start_date'=> $result['start_date'],
					'end_date'=> $result['end_date'],
					'start_date_is_visible' => $result['start_date_is_visible']==1,
					'end_date_is_visible' => $result['end_date_is_visible']==1,
					'status'=> $result['taskStatus'],
					'priority_id'=> $result['priorityId'],
					'priority'=> $priority,
					'internal_status_id'=> $result['statusId'],
					'internal_status'=> $status,
					'parent_id'=> $result['parentId'] ?: 0,
					'parent'=> $parent,
					'created_at'=> $result['taskCreatedAt'],
					'updated_at'=> $result['taskUpdatedAt'],
					'ganttIsVisible' => (int)$result['ganttIsVisible'],
					'isSubtask' => $isSubtask,
					'children' => isset($children[ $result['taskId'] ]) && sizeof($children[ $result['taskId'] ])>0 ? $children[ $result['taskId'] ] : [],
//					hideChildren: value.children && value.children.length > 0 ? false : undefined,
					'hideChildren' => isset($children[ $result['taskId'] ]) && sizeof($children[ $result['taskId'] ])>0 ? false : null,
					'type' => $result['parentId']?'task':'project',
					'start' => $start,
					'end' => $end,
					'isMissingDates' => $isMissing,
					'duration' => $durationDay,

				];
			}


			$groupConvertToArray = array_reduce($groupedMap, function ($carry, $group) {
				usort($group, function ($a, $b) {
					if ($a['type'] === "project" && $b['type'] !== "project") return -1;
					if ($a['type'] !== "project" && $b['type'] === "project") return 1;
					//return $a['displayOrder'] <=> $b['displayOrder'];
					// fallback to sort_order or id if displayOrder not present
					$aOrder = $a['displayOrder'] ?? $a['sort_order'] ?? 0;
					$bOrder = $b['displayOrder'] ?? $b['sort_order'] ?? 0;

					return $aOrder <=> $bOrder;
				});

				foreach ($group as $task) {
					$carry[] = $task;
				}

				return $carry;
			}, []);

			foreach ( $groupConvertToArray as $key=>$item ) {
				$item['displayOrder'] = $key+1;
				$returnArray[] = $item;
			}

		}
		return $returnArray;
	}

	public function ganttChartStartDateEndDate( $start_date, $end_date )
	{
		$today = new \DateTime('now');
		$defaultDuration = 1;
		$isMissing = empty($start_date) || empty($end_date);

		$stDate = empty($start_date) && !empty($end_date) && date('Y-m-d', strtotime( $end_date ) ) < date('Y-m-d') ? date('Y-m-d', strtotime( $end_date ) ): date('Y-m-d');

		$startDate = !empty($start_date) ? date('Y-m-d H:i', strtotime( $start_date. ' 00:00' ) ) : date('Y-m-d H:i', strtotime( $stDate . ' 00:00' ) );
		$endDate = !empty($end_date) ? date('Y-m-d H:i', strtotime( $end_date. ' 23:59' ) ) : date('Y-m-d H:i', strtotime( $today->format('Y-m-d') . ' 23:59' ) );

		/*if ($startDate && $endDate && $startDate == $endDate) {
			// If start and end date are the same, set the end date to one day later
			$endDate = (new \DateTime($startDate))->modify("+{$defaultDuration} day")->format('Y-m-d');
		}
		$start = $isMissing
			? clone $today
			: new \DateTime( $startDate );
		$end = $isMissing
			? (clone $start)->modify("+{$defaultDuration} day")
			: new \DateTime( $endDate );


		$startOnlyDate = $start->format('Y-m-d');
		$endOnlyDate = $end->format('Y-m-d');

		return [$startOnlyDate, $endOnlyDate, $isMissing];*/
		//calculation duration using startDate and endDate
		$durationDay = number_format((strtotime($endDate) - strtotime($startDate)) / (60 * 60 * 24));

		return [$startDate, $endDate, $isMissing, $durationDay];


	}



}