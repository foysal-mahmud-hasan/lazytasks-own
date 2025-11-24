<?php

namespace Lazytask\Helper;
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

class Lazytask_DatabaseQuerySchema {

	public static function getTaskSectionsByProjectId($projectId) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$tableName = LAZYTASK_TABLE_PREFIX . 'task_sections';
		$tasksTable = LAZYTASK_TABLE_PREFIX . 'tasks';

		$results = $db->get_results($db->prepare(
			"SELECT * FROM $tableName 
         	WHERE deleted_at IS NULL 
           AND deleted_by IS NULL 
           AND project_id = %d AND mark_is_complete IN ('regular', 'complete') order by sort_order ASC", (int)$projectId), ARRAY_A);
		$arrayReturn = [];
		if ($results){
			foreach ( $results as $result ) {

				$isVisibleOnGantt = $db->get_var($db->prepare(
					"SELECT COUNT(*) FROM $tasksTable 
					WHERE section_id = %d 
					AND status != 'COMPLETED'
					AND deleted_at IS NULL 
					AND is_visible_on_gantt = 1",
					$result['id']
				));

				$arrayReturn[$result['slug']] = [
					'id' => $result['id'],
					'name' => $result['name'],
					'slug' => $result['slug'],
					'sort_order' => $result['sort_order'],
					'mark_is_complete' => $result['mark_is_complete'],
					'is_visible_on_gantt' => $isVisibleOnGantt > 0 ? true : false,
				];
			}
		}

		return $arrayReturn;
	}


	public static function getProjectPriorities($projectId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$priorityTable = LAZYTASK_TABLE_PREFIX . 'project_priorities';
		$projectTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$sql = "SELECT project.id as projectId, priority.id as priorityId, priority.name as priorityName, priority.color_code as color_code, priority.sort_order as sort_order 
				FROM `{$priorityTable}` as priority 
				JOIN `{$projectTable}` as project ON priority.`project_id` = project.`id` 
				WHERE project.`id` = %d ORDER BY priority.sort_order ASC";
		$results = $db->get_results($db->prepare(
			$sql, (int)$projectId
		), ARRAY_A);

		// Basic slug generator
		$make_slug = function($string) {
			$slug = strtolower($string);
			$slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
			return trim($slug, '-');
		};

		$returnArray = [];
		if($results){
			foreach ( $results as $result ) {
				$baseSlug = $make_slug($result['priorityName']);
            	$slug = $baseSlug . '-' . $result['priorityId'];
				$returnArray[] = [
					'id' => $result['priorityId'],
					'name' => $result['priorityName'],
					'slug' => $slug,
					'project_id' => $result['projectId'],
					'color_code' => $result['color_code'],
					'sort_order' => $result['sort_order'],
				];
			}
		}
		return $returnArray;
	}

	//getProjectPriorityById
	public static function getProjectPriorityById($priorityId, $projectId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$priorityTable = LAZYTASK_TABLE_PREFIX . 'project_priorities';
		$sql = "SELECT * FROM `{$priorityTable}` WHERE `id` = %d AND project_id = %d";
		$results = $db->get_row($db->prepare(
			$sql, (int)$priorityId, (int)$projectId
		), ARRAY_A);
		return $results;
	}

	//all projects
	public static function getAllProjects(){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$projectTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$sql = "SELECT * FROM `{$projectTable}` WHERE deleted_at IS NULL AND deleted_by IS NULL";
		$results = $db->get_results($sql, ARRAY_A);
		return $results ? $results : [];
	}

	// get project status
	public static function getProjectStatus($projectId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$statusTable = LAZYTASK_TABLE_PREFIX . 'project_statuses';
		$projectTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$sql = "SELECT project.id as projectId, status.id as statusId, status.name as statusName, status.slug as statusSlug, status.is_active as statusIsActive, status.color_code as color_code, status.sort_order as sort_order 
				FROM `{$statusTable}` as status 
				JOIN `{$projectTable}` as project ON status.`project_id` = project.`id` 
				WHERE project.`id` = %d AND status.is_active = '1' AND status.deleted_at IS NULL ORDER BY status.sort_order ASC";
		$results = $db->get_results($db->prepare(
			$sql, (int)$projectId
		), ARRAY_A);

		$returnArray = [];
		if($results){
			foreach ( $results as $result ) {
				$slug = $result['statusSlug'] . '-' . $result['statusId'];
				$returnArray[] = [
					'id' => $result['statusId'],
					'name' => $result['statusName'],
					'slug' => $slug,
					'project_id' => $result['projectId'],
					'color_code' => $result['color_code'],
					'sort_order' => $result['sort_order'],
				];
			}
		}
		return $returnArray;
	}

	//getProjectStatusById
	public static function getProjectStatusById($statusId, $projectId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$statusTable = LAZYTASK_TABLE_PREFIX . 'project_statuses';
		$sql = "SELECT * FROM `{$statusTable}` WHERE `id` = %d AND project_id = %d";
		$results = $db->get_row($db->prepare(
			$sql, (int)$statusId, (int)$projectId
		), ARRAY_A);
		return $results;
	}

}