<?php

namespace Lazytask\Controller;

use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use WP_REST_Request;
use WP_REST_Response;

final class Lazytask_TagController {

	const TABLE_TAGS = LAZYTASK_TABLE_PREFIX . 'tags';

	public function getAllTags() {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$tagTableName = LAZYTASK_TABLE_PREFIX . 'tags';
		$taskTagTable = LAZYTASK_TABLE_PREFIX . 'task_tags';

		$query = "SELECT tags.id,tags.name, 
				tags.status, 
				tags.created_at, 
				tags.updated_at, 
				COUNT(task_tags.task_id) AS task_count
			FROM {$tagTableName} AS tags
			LEFT JOIN {$taskTagTable} AS task_tags ON tags.id = task_tags.tag_id WHERE tags.deleted_at IS NULL
			GROUP BY tags.id";

		try {
			$tags = $db->get_results($query, ARRAY_A);
			if($tags) {
				return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$tags], 200);
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'No tags found', 'data'=>[]], 200);
		} catch (\Exception $e) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Error', 'data'=>[]], 400);
		}

	}

	public function create( WP_REST_Request $request ) {

		global $wpdb;

		$requestData = $request->get_json_params();

	  $response = $this->tagGetOrCreate($requestData);
	  if($response) {
	  	return new WP_REST_Response(['status'=>200, 'message'=>'Tag created successfully', 'data'=>$response], 200);
	  }
	  return new WP_REST_Response(['status'=>400, 'message'=>'Tag creation failed', 'data'=>[]], 400);

	}

	public function tagGetOrCreate( $requestData ) {

		global $wpdb;

		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$tagsTable = LAZYTASK_TABLE_PREFIX . 'tags';

		$name = isset($requestData['name']) && $requestData['name']!='' ? $requestData['name'] : null;
		if(!$name) {
			return new WP_REST_Response(['status'=>400, 'message'=>'Name is required', 'data'=>[]], 400);
		}

		$created_at = current_time('mysql');
		$submittedData = [];
		$submittedData['name'] = sanitize_text_field($name);
		$submittedData['parent_id'] = isset($requestData['parent_id']) ? (int)$requestData['parent_id']:null;
		$submittedData['description'] = isset($requestData['description']) ? sanitize_textarea_field($requestData['description']):null;
		$submittedData['created_at'] = $created_at;
		$submittedData['user_id'] = isset($requestData['user_id']) && $requestData['user_id'] != "" ? (int)$requestData['user_id'] : null;

		try {

			if($db->get_var($db->prepare("SELECT COUNT(*) FROM {$tagsTable} WHERE deleted_at IS NULL AND name = %s", $name)) > 0) {
				$existTag = $db->get_row($db->prepare("SELECT * FROM {$tagsTable} WHERE deleted_at IS NULL AND name =%s", $name), ARRAY_A);

				return $existTag;
			}
			$db->query('START TRANSACTION');

			$db->insert($tagsTable, $submittedData);

			$db->query('COMMIT');

			$tagId = $db->insert_id;

			$tag = $db->get_row($db->prepare("SELECT * FROM {$tagsTable} WHERE id =%d",$tagId), ARRAY_A);

			return $tag;
		} catch (\Exception $e) {
			return null;
		}

	}

	public function getTagById( $id )
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$tagsTable = LAZYTASK_TABLE_PREFIX . 'tags';
		$userTable = $wpdb->prefix . 'users';

		$row = $db->get_row($db->prepare("SELECT * FROM {$tagsTable} as tags
			WHERE id = %d", (int)$id), ARRAY_A);
		if($row){
			return [
				'id' => $row['id'],
				'name' => $row['name'],
				'sort_order' => $row['sort_order'],
				'status' => $row['status'],
				'created_at' => $row['created_at'],
				'updated_at' => $row['updated_at'],
			];
		}
		return null;

	}

	// delete quick task
	public function delete(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$deleted_at = current_time('mysql');
		
		$id = $request->get_param('id');

		$tag = $this->getTagById($id);
		if (!$tag) {
			return new WP_Error('not_found', 'Tag not found.', array('status' => 404));
		}
		
		$tagTable = LAZYTASK_TABLE_PREFIX . 'tags';
		$taskTagTable = LAZYTASK_TABLE_PREFIX . 'task_tags';

		$db->update(
			$taskTagTable,
			['deleted_at' => $deleted_at],
			['tag_id' => $id]
		);
		
		$db->update(
			$tagTable,
			array(
				"deleted_at" => $deleted_at
			),
			array( 'id' => $id )
		);
		
		return new WP_REST_Response(['status'=>200, 'message'=>'Tag removed successfully', 'data'=>['id'=>$id] ], 200);
		
		
	}
}