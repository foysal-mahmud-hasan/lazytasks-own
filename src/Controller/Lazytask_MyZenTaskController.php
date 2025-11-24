<?php

namespace Lazytask\Controller;

use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use WP_REST_Request;
use WP_REST_Response;

final class Lazytask_MyZenTaskController {

	const TABLE_MY_ZEN_TASKS = LAZYTASK_TABLE_PREFIX . 'my_zen_tasks';

	public function getAllMyZenTasks(WP_REST_Request $request) {
		global $wpdb;
		$token = $request->get_header('Authorization');
		$token = str_replace('Bearer ', '', $token);
		$token = str_replace('bearer ', '', $token);
		$token = str_replace('Token ', '', $token);
		$token = str_replace('token ', '', $token);
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		// decode token
		$userController = new Lazytask_UserController();
		$decodedToken = $userController->decode($token);
		if($decodedToken && isset($decodedToken['status']) && $decodedToken['status'] == 403 && isset($decodedToken['message']) && $decodedToken['message'] == 'Expired token'){
			return new WP_REST_Response(['code'=> 'jwt_auth_invalid_token', 'status'=>403, 'message'=>$decodedToken['message'], 'data'=>$decodedToken], 403);
		}

		$loggedUserId = isset( $decodedToken['data']['user_id'] ) && $decodedToken['data']['user_id']!='' ? $decodedToken['data']['user_id'] : null;

		if(!$loggedUserId) {
			return new WP_REST_Response(['status'=>400, 'message'=>'User id is required', 'data'=>[]], 400);
		}

		$myZenTaskTableName = LAZYTASK_TABLE_PREFIX . 'my_zen_tasks';

		$query = "SELECT * FROM {$myZenTaskTableName} WHERE created_by = %d";
		$myZenTasks = $db->get_results($db->prepare($query, $loggedUserId), ARRAY_A);
		try {
			if($myZenTasks) {
				$myZenTasks = array_map(function($myZenTask) {
					$myZenTask['start_time'] = $myZenTask['start_date_time'] ? gmdate('H:i', strtotime($myZenTask['start_date_time']) ) : null;
					$myZenTask['end_time'] = $myZenTask['end_date_time'] ? gmdate('H:i', strtotime($myZenTask['end_date_time'])) : null;
					return $myZenTask;
				}, $myZenTasks);
				return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$myZenTasks], 200);
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'No my_zen_tasks found', 'data'=>[]], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}

	}

	public function create( WP_REST_Request $request ) {

		global $wpdb;

		$requestData = $request->get_json_params();

	  $response = $this->myZenTaskCreate($requestData);
	  if($response) {
	  	return new WP_REST_Response(['status'=>200, 'message'=>'My zen task created successfully', 'data'=>$response], 200);
	  }
	  return new WP_REST_Response(['status'=>400, 'message'=>'My zen task creation failed', 'data'=>[]], 400);

	}

	public function myZenTaskCreate( $requestData ) {

		global $wpdb;

		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$myZenTasksTable = LAZYTASK_TABLE_PREFIX . 'my_zen_tasks';

		$name = isset($requestData['name']) && $requestData['name']!='' ? $requestData['name'] : null;
		if(!$name) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Name is required', 'data'=>[]], 400);
		}

		$created_at = current_time('mysql');
		$submittedData = [];
		$submittedData['name'] = sanitize_text_field($name);
		$submittedData['slug'] = sanitize_text_field(isset($requestData['slug']) ? $requestData['slug'] : sanitize_title($name));
		$submittedData['task_id'] = isset($requestData['task_id']) ? (int)$requestData['task_id']:null;
		$submittedData['project_id'] = isset($requestData['project_id']) ? $requestData['project_id']:null;
		$submittedData['description'] = isset($requestData['description']) ? sanitize_textarea_field($requestData['description']):null;

		$submittedData['start_date'] = isset($requestData['start_date']) ? gmdate('Y-m-d', strtotime($requestData['start_date'])):null;
		$submittedData['end_date'] = isset($requestData['end_date']) ? gmdate('Y-m-d', strtotime($requestData['end_date'])):null;
		$submittedData['start_date_time'] = $submittedData['start_date'] && isset($requestData['start_time']) ? gmdate('Y-m-d H:i:s', strtotime($submittedData['start_date'].' '.$requestData['start_time'])):null;
		$submittedData['end_date_time'] = $submittedData['end_date'] && isset($requestData['end_time']) ? gmdate('Y-m-d H:i:s', strtotime($submittedData['end_date'].' '.$requestData['end_time'])) :null;

		$submittedData['created_at'] = $created_at;
		$submittedData['created_by'] = isset($requestData['user_id']) && $requestData['user_id'] != "" ? (int)$requestData['user_id'] : null;

		try {

			$db->query('START TRANSACTION');
			//check if the task already exists by task_id
			if(isset($submittedData['task_id']) && $submittedData['task_id'] && isset($submittedData['created_by']) && $submittedData['created_by']) {
				$myZenTask = $db->get_row($db->prepare("SELECT * FROM {$myZenTasksTable} WHERE task_id =%d AND created_by=%d",(int)$submittedData['task_id'], (int)$submittedData['created_by']), ARRAY_A);
				if($myZenTask) {
					$myZenTask['start_time'] = $myZenTask['start_date_time'] ? gmdate('H:i', strtotime($myZenTask['start_date_time'])) : null;
					$myZenTask['end_time'] = $myZenTask['end_date_time'] ? gmdate('H:i', strtotime($myZenTask['end_date_time'])) : null;
					return $myZenTask;
				}
			}

			$db->insert($myZenTasksTable, $submittedData);

			$db->query('COMMIT');

			$myZenTaskId = $db->insert_id;

			$myZenTask = $db->get_row($db->prepare("SELECT * FROM {$myZenTasksTable} WHERE id =%d",$myZenTaskId), ARRAY_A);
			if($myZenTask) {
				$myZenTask['start_time'] = $myZenTask['start_date_time'] ? gmdate('H:i', strtotime($myZenTask['start_date_time'])) : null;
				$myZenTask['end_time'] = $myZenTask['end_date_time'] ? gmdate('H:i', strtotime($myZenTask['end_date_time'])) : null;
				return $myZenTask;
			}

			return [];
		} catch (\Exception $e) {
			return null;
		}

	}

	public function update( WP_REST_Request $request ) {

		global $wpdb;

		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$myZenTasksTable = LAZYTASK_TABLE_PREFIX . 'my_zen_tasks';

		$id = $request->get_param('id');
		$requestData = $request->get_json_params();

		$submittedData = [];
		$submittedData['start_date'] = isset($requestData['start_date']) ? gmdate('Y-m-d', strtotime($requestData['start_date'])):null;
		$submittedData['end_date'] = isset($requestData['end_date']) ? gmdate('Y-m-d', strtotime($requestData['end_date'])):null;
		$submittedData['start_date_time'] = $submittedData['start_date'] && isset($requestData['start_time']) && $requestData['start_time'] ? gmdate('Y-m-d H:i:s', strtotime($submittedData['start_date'].' '.$requestData['start_time'])):null;
		$submittedData['end_date_time'] = $submittedData['end_date'] && isset($requestData['end_time']) && $requestData['end_time'] ? gmdate('Y-m-d H:i:s', strtotime($submittedData['end_date'].' '.$requestData['end_time'])) :null;

		try {

			$db->query('START TRANSACTION');

			$db->update($myZenTasksTable, $submittedData, ['id' => $id]);

			$db->query('COMMIT');

			$myZenTaskId = $id;

			$myZenTask = $db->get_row($db->prepare("SELECT * FROM {$myZenTasksTable} WHERE id =%d",(int)$myZenTaskId), ARRAY_A);
			if($myZenTask) {
				$myZenTask['start_time'] = $myZenTask['start_date_time'] ? gmdate('H:i', strtotime($myZenTask['start_date_time'])) : null;
				$myZenTask['end_time'] = $myZenTask['end_date_time'] ? gmdate('H:i', strtotime($myZenTask['end_date_time'])) : null;
				return new WP_REST_Response(['status'=>200, 'message'=>'My zen task updated successfully', 'data'=>$myZenTask, 'requestData'=>$requestData], 200);
			}
			return new WP_REST_Response(['status'=>404, 'message'=>'My zen task creation failed'], 400);
		} catch (\Exception $e) {
			return null;
		}

	}
}