<?php

namespace Lazytask\Controller;

use Lazytask\Helper\Lazytask_DatabaseQuerySchema;
use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use Lazytask\Helper\Lazytask_SlugGenerator;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

final class Lazytask_ProjectController {

	const TABLE_PROJECTS = LAZYTASK_TABLE_PREFIX . 'projects';
	public function getAllProjects(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$projectsTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';

		$requestData = $request->get_params();

		$query = "SELECT projects.id, projects.name, projects.slug, projects.code,
				 projects.status, projects.company_id, company.name as companyName
				FROM {$projectsTable} as projects
				JOIN {$companyTable} as company ON projects.company_id = company.id
				WHERE projects.deleted_at IS NULL";
		$companyId = null;
		// filter by company_id
		if(isset($requestData['company_id']) && $requestData['company_id'] != ''){
			$query .= " AND projects.company_id = %d";
			$companyId = (int)$requestData['company_id'];
			$prepared_query = $db->prepare($query, $companyId);

		}else{
			$prepared_query = $db->prepare($query);
		}


		$results = $db->get_results($prepared_query, ARRAY_A);

		$returnArray = [];
		if($results && count($results) > 0){
			$projectsId = array_column($results, 'id');
			$projectController = new Lazytask_ProjectController();
			$projectMembers = $projectController->getProjectMembers($projectsId);
			$projectInvitedMembers = $projectController->getProjectInvitedMembers($projectsId);
			$projectTasks = $projectController->getNoOfTasksByProject($projectsId);
			$companyController = new Lazytask_CompanyController();
			$companyMembers = $companyController->getCompanyMembers(array_unique(array_column($results, 'company_id')));

			foreach ($results as $key => $value) {
				$returnArray[] = [
					'id' => $value['id'],
					'name' => $value['name'],
					'slug' => $value['slug'],
					'code' => $value['code'],
					'status' => $value['status'],
					'company_id' => $value['company_id'],
					'company_name' => $value['companyName'],
					'members' => isset($projectMembers[ $value['id'] ]) ? $projectMembers[ $value['id'] ] :[],
					'invitedMembers' => isset($projectInvitedMembers[ $value['id'] ]) ? $projectInvitedMembers[ $value['id'] ] :[],
					'total_tasks' => isset($projectTasks[ $value['id'] ]) ? $projectTasks[ $value['id'] ] : '0',
					'parent' => ['id'=>$value['company_id'], 'name'=>$value['companyName'], 'members'=> isset($companyMembers[ $value['company_id'] ]) && sizeof($companyMembers[ $value['company_id'] ]) >0 ? $companyMembers[ $value['company_id'] ] :[]]
				];
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$returnArray, 'requestData'=>$requestData], 200);
		}
		return new WP_REST_Response(['status'=>200, 'message'=>'No record found', 'data'=>$returnArray], 200);
	}
	const TABLE_PROJECT_MEMBERS = LAZYTASK_TABLE_PREFIX . 'projects_users';


	public function create(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$projectTable = LAZYTASK_TABLE_PREFIX.'projects';
		$companiesMembersTable = LAZYTASK_TABLE_PREFIX.'companies_users';
		$requestData = $request->get_json_params();
		$name = sanitize_text_field($requestData['name']);
		$slug = Lazytask_SlugGenerator::slug($name, self::TABLE_PROJECTS, 'slug' );
		$code = $requestData['code'];
		$address = sanitize_textarea_field($requestData['address']);
		$owner_id = isset($requestData['owner_id']) && $requestData['owner_id']!="" ? $requestData['owner_id']: null;
		$companyId = $requestData['company_id'];
		$created_at = current_time('mysql');
		$updated_at = current_time('mysql');
		$members = isset($requestData['members']) && sizeof($requestData['members'])> 0 ? $requestData['members'] : [];
		$createdBy = isset($requestData['created_by']) && $requestData['created_by']!='' ? $requestData['created_by'] : null;
		$default_settings = [
			'navbar' => [
				'list' => true,
				'board' => true,
				'calendar' => true,
				'gantt' => true,
				'whiteboard' => true,
				'swimlane' => true,
			]
		];

		$db->insert(
			$projectTable,
			array(
				"owner_id" => (int)$owner_id,
				"company_id" => (int)$companyId,
				"name" => $name,
				"slug" => $slug,
				"code" => $code,
				"address" => $address,
				"settings" => json_encode($default_settings),
				"created_at" => $created_at,
				"updated_at" => $updated_at,
				'created_by' => (int)$createdBy,
				),
			[
				'%d',
				'%d',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%d'
			]
		);
		$project_id = $wpdb->insert_id;
		if($project_id){
			if(sizeof($members)>0){

				$loggedInUserId = isset($requestData['created_by']) && $requestData['created_by']!='' ? $requestData['created_by'] : null;
				$loggedInUser = get_user_by('ID', $loggedInUserId);
				$userController = new Lazytask_UserController();

				$uniqueMembers = array_unique( array_column( $members, 'id' ) );
				$projectMembersTable = LAZYTASK_TABLE_PREFIX.'projects_users';
				foreach ( $uniqueMembers as $member ) {
					$db->insert($projectMembersTable, [
						"project_id" => $project_id,
						"user_id" => (int)$member,
						"created_at" => $created_at,
						"updated_at" => $updated_at,
					],
						[
							'%d',
							'%d',
							'%s',
							'%s',
						]

					);

					$checkExistCompanyMember = $db->get_row(
						$db->prepare(
							"SELECT * FROM `{$companiesMembersTable}` WHERE company_id = %d AND user_id = %d", (int)$companyId, (int)$member ) );

					if(!$checkExistCompanyMember){
						$db->insert(
							$companiesMembersTable,
							array(
								"company_id" => (int)$companyId,
								"user_id" => (int)$member,
								"created_at" => current_time('mysql'),
								"updated_at" => current_time('mysql'),
							),
							[
								'%d',
								'%d',
								'%s',
								'%s',
							]
						);
					}
				}

				

				$memberName = $members[array_search($member, array_column($members, 'id'))]['name'];

				$roles = $userController->getRolesByUser((int)$member);

				$userHasRoles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [];
				$rolesName = sizeof($userHasRoles) > 0 ? implode(', ', array_column($userHasRoles, 'name')) : '';

				$referenceInfo = ['id'=>$project_id, 'name'=>$name, 'type'=>'project'];
				$placeholdersArray = ['member_name' => $memberName, 'project_name'=>$name, 'creator_name'=> $loggedInUser ? $loggedInUser->display_name:'', 'member_roles'=>$rolesName];

				do_action('lazytask_project_assigned_member', $referenceInfo, ['web-app', 'email', 'sms'], [$member], $placeholdersArray);

			}

			$defaultPriorities = ['Low', 'Medium', 'High'];
			$defaultColors = ['#00FF00', '#FFA500', '#dd4040'];
			$projectPrioritiesTable = LAZYTASK_TABLE_PREFIX.'project_priorities';
			foreach ($defaultPriorities as $key => $value) {
				$db->insert(
					$projectPrioritiesTable,
					array(
						"project_id" => $project_id,
						"name" => $value,
						"color_code" => $defaultColors[$key],
						"sort_order" => $key+1,
						"created_at" => $created_at,
						"updated_at" => $updated_at,
					),
					[
						'%d',
						'%s',
						'%s',
						'%d',
						'%s',
						'%s',
					]
				);
			}

			$defaultStatuses = ['Active', 'In Progress', 'Complete'];
			$defaultStatusColors = ['#2D9CDB', '#F2C94C', '#27AE60'];
			$projectStatusTable = LAZYTASK_TABLE_PREFIX.'project_statuses';
			foreach ($defaultStatuses as $key => $status) {
				$db->insert(
					$projectStatusTable,
					array(
						"project_id" => $project_id,
						"name" => $status,
						"slug" => strtolower(str_replace(' ', '-', $status)),
						"color_code" => $defaultStatusColors[$key],
						"sort_order" => $key+1,
						"is_active" => 1,
						"created_at" => $created_at,
						"updated_at" => $updated_at,
					),
					[
						'%d',
						'%s',
						'%s',
						'%s',
						'%d',
						'%d',
						'%s',
						'%s',
					]
				);
			}

			$properties['attributes'] = [
				'name' => $name,
				'slug' => $slug,
				'code' => $code,
				'address' => $address,
				'owner_id' => $owner_id,
				'company_id' => $companyId,
				'created_at' => $created_at,
			];
			$activityLogArg = [
				"user_id" => $createdBy,
				"subject_id" => $project_id,
				"subject_name" => 'project',
				"subject_type" => 'project',
				"event" => 'created',
				"properties" => wp_json_encode($properties),
				"created_at" => $created_at,
			];
			$activityLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
			$db->insert($activityLogTable, $activityLogArg);

		}
		$data =  $this->getProjectById($project_id);
		if($data){
			return new WP_REST_Response(['status'=>200, 'message'=>'Project created successfully', 'data'=>$data], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Project not found', 'data'=>null], 404);
	}

	public function update(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$projectTableName = LAZYTASK_TABLE_PREFIX . 'projects';

		$companiesMembersTable = LAZYTASK_TABLE_PREFIX.'companies_users';

		// Sanitize and validate the input data
		$requestData = $request->get_json_params();


		$id = $request->get_param('id');
		if(!$id){
			return array('message' => 'Project ID is required');
		}
		$prevProject = $this->getProjectById($id);

		$prevProjectMembers = $prevProject['members'];
		$prevProjectMembersId = $prevProjectMembers && sizeof($prevProjectMembers) > 0 ? array_column($prevProjectMembers, 'id'):[];


		$submittedData = [];
		$properties = [];
		if(isset($requestData['name'])){
			$submittedData['name'] = $requestData['name']!="" ? sanitize_text_field($requestData['name']) : '';
			if($prevProject['name'] != $submittedData['name']){
				$properties['old']['name'] = $prevProject['name'];
				$properties['attributes']['name'] = $submittedData['name'];
			}
		}
		if(isset($requestData['code'])){
			$submittedData['code'] = $requestData['code']!="" ? sanitize_text_field($requestData['code']) : '';
		}
		if(isset($requestData['slug'])){
			$newSlug = Lazytask_SlugGenerator::slug($requestData['name'], self::TABLE_PROJECTS, 'slug' );
			$submittedData['slug'] = $requestData['slug']!="" ? sanitize_text_field($requestData['slug']) : $newSlug;
		}
		if(isset($requestData['address'])){
			$submittedData['address'] = $requestData['address']!="" ? sanitize_textarea_field($requestData['address']) : '';
		}
		if(isset($requestData['status'])){
			$submittedData['status'] = $requestData['status']!="" ? $requestData['status'] : null;
		}

		if(sizeof($submittedData)>0){
			$submittedData['updated_at'] = current_time('mysql');
			$db->update(
				$projectTableName,
				$submittedData,
				array( 'id' => $id )
			);
		}
		$members = isset($requestData['members']) && sizeof($requestData['members'])> 0 ? $requestData['members'] : [];

		if ( isset( $requestData['members'] ) ) {

				$loggedInUserId = isset($requestData['updated_by']) && $requestData['updated_by']!="" ? $requestData['updated_by'] : null;
				$loggedInUser = get_user_by('ID', $loggedInUserId);
				$userController = new Lazytask_UserController();

				$db->delete(self::TABLE_PROJECT_MEMBERS, array('project_id' => $id));
			if( sizeof( $members ) > 0 ){
				$uniqueMembers = array_unique( array_column( $members, 'id' ) );
				// Then, insert the new members
				foreach ( $uniqueMembers as $member ) {
					$db->insert( self::TABLE_PROJECT_MEMBERS, array(
						"project_id" => $id,
						"user_id"    => (int) $member,
						"created_at" => gmdate( 'Y-m-d H:i:s' ),
						"updated_at" => gmdate( 'Y-m-d H:i:s' ),
					) );

					$user = get_user_by('ID', (int) $member);
					if ( $user->roles ) {
						if (in_array('administrator', $user->roles)) {
							$roleEmployee = $db->get_row("SELECT * FROM ". LAZYTASK_TABLE_PREFIX . "roles WHERE slug = 'superadmin'");
						}else{
							//role Employee
							$roleEmployee = $db->get_row("SELECT * FROM ". LAZYTASK_TABLE_PREFIX . "roles WHERE slug = 'employee'");
						}

						$checkUserHasRole = $db->get_row("SELECT * FROM ". LAZYTASK_TABLE_PREFIX . "user_has_roles WHERE user_id = $user->ID");

						if( $checkUserHasRole == null ){
							$db->insert( LAZYTASK_TABLE_PREFIX . "user_has_roles", [
								'user_id' => $user->ID,
								'role_id' => $roleEmployee->id
							]);
							$roles = array(
								0 => array(
									"id" => (string)$roleEmployee->id,
									"name" => $roleEmployee->name,
								)
							);
							$arraySerialize = serialize( $roles );
							add_user_meta($user->ID, 'lazytasks_capabilities', $arraySerialize, true);
						}else{
							$existingRoleId = $checkUserHasRole->role_id;
							if ( $existingRoleId != $roleEmployee->id ) {
								$db->update( LAZYTASK_TABLE_PREFIX . "user_has_roles", [
									'role_id' => $roleEmployee->id
								], [
									'user_id' => $user->ID
								] );
								$roles = array(
									0 => array(
										"id" => (string)$roleEmployee->id,
										"name" => $roleEmployee->name,
									)
								);
								$arraySerialize = serialize( $roles );
								update_user_meta( $user->ID, 'lazytasks_capabilities', $arraySerialize );
							}
						}
					}


					$checkExistCompanyMember = $db->get_row(
						$db->prepare(
							"SELECT * FROM `{$companiesMembersTable}` WHERE company_id = %d AND user_id = %d", (int)$prevProject['company_id'], (int)$member ) );

					if(!$checkExistCompanyMember){
						$db->insert(
							$companiesMembersTable,
							array(
								"company_id" => (int)$prevProject['company_id'],
								"user_id" => (int)$member,
								"created_at" => current_time('mysql'),
								"updated_at" => current_time('mysql'),
							),
							[
								'%d',
								'%d',
								'%s',
								'%s',
							]
						);
					}


					if(!in_array($member, $prevProjectMembersId)){

						$memberName = $members[array_search($member, array_column($members, 'id'))]['name'];


						$roles = $userController->getRolesByUser((int)$member);

						$userHasRoles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [];
						$rolesName = sizeof($userHasRoles) > 0 ? implode(', ', array_column($userHasRoles, 'name')) : '';

						$referenceInfo = ['id'=>$id, 'name'=>$prevProject['name'], 'type'=>'project'];
						$placeholdersArray = ['member_name' => $memberName, 'project_name'=>$prevProject['name'], 'creator_name'=> $loggedInUser ? $loggedInUser->display_name:'', 'member_roles'=>$rolesName];

						do_action('lazytask_project_assigned_member', $referenceInfo, ['web-app', 'email', 'sms'], [$member], $placeholdersArray);
					}
				}
			}
		}

		$ids=[];
		if(isset($requestData['deleted_member_id']) && $requestData['deleted_member_id']!=""){
			$tableTaskMembers = LAZYTASK_TABLE_PREFIX . 'task_members';
			$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
			// get all tasks by project id and member id using join query
			$tasks = $db->get_results(
				$db->prepare(
					"SELECT tasks.id FROM `{$taskTable}` as tasks
					JOIN `{$tableTaskMembers}` as taskMembers  ON tasks.id = taskMembers.task_id
					WHERE tasks.project_id = %d AND taskMembers.user_id = %d", (int)$id, (int)$requestData['deleted_member_id']), ARRAY_A);
			//delete task members
			if($tasks && sizeof($tasks)>0){
				$taskIds = array_column($tasks, 'id');
				if (!empty($taskIds)) {
					// Prepare a single query to delete all relevant task members
					$placeholders = implode(',', array_fill(0, count($taskIds), '%d'));
					$sql = "DELETE FROM {$tableTaskMembers} WHERE task_id IN ($placeholders) AND user_id = %d";

					// Prepare the arguments array
					$args = array_merge($taskIds, [(int)$requestData['deleted_member_id']]);

					// Execute the query
					$wpdb->query($wpdb->prepare($sql, ...$args));
				}

			}

			$userController = new Lazytask_UserController();
			$loggedInUserId = isset($requestData['updated_by']) && $requestData['updated_by']!="" ? $requestData['updated_by'] : null;
			$memberId= $requestData['deleted_member_id'];
			$member = get_user_by('ID', $memberId);
			$loggedInUser = get_user_by('ID', $loggedInUserId);
			$projectMembersTable = LAZYTASK_TABLE_PREFIX.'projects_users';
			$db->delete($projectMembersTable, array('project_id' => $id, 'user_id'=>$requestData['deleted_member_id']));

			$companiesMembersTable = LAZYTASK_TABLE_PREFIX.'companies_users';
        
			// Check if user has any other projects in this workspace
			$otherProjects = $db->get_row(
				$db->prepare(
					"SELECT pm.* FROM `{$projectMembersTable}` pm 
					JOIN `{$projectTableName}` p ON pm.project_id = p.id 
					WHERE p.company_id = %d AND pm.user_id = %d", 
					(int)$prevProject['company_id'], 
					(int)$requestData['deleted_member_id']
				)
			);

			// If user has no other projects, remove from companies_users table
			if (!$otherProjects) {
				$db->delete(
					$companiesMembersTable, 
					array(
						'company_id' => (int)$prevProject['company_id'],
						'user_id' => (int)$requestData['deleted_member_id']
					)
				);
			}

			$memberName = $member ? $member->display_name:null;
			$roles = $userController->getRolesByUser((int)$member->ID);

			$userHasRoles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [];
			$rolesName = sizeof($userHasRoles) > 0 ? implode(', ', array_column($userHasRoles, 'name')) : '';

			$referenceInfo = ['id'=>$id, 'name'=>$prevProject['name'], 'type'=>'project'];
			$placeholdersArray = ['member_name' => $memberName, 'project_name'=>$prevProject['name'], 'creator_name'=> $loggedInUser ? $loggedInUser->display_name:'', 'member_roles'=>$rolesName];

			do_action('lazytask_project_removed_member', $referenceInfo, ['web-app', 'email', 'sms'], [$memberId], $placeholdersArray);

		}

		if(sizeof($properties)>0){
			$updatedBy = isset($requestData['updated_by']) && $requestData['updated_by']!="" ? $requestData['updated_by'] : null;
			$activityLogArg = [
				"user_id" => $updatedBy,
				"subject_id" => $id,
				"subject_name" => 'project',
				"subject_type" => 'project',
				"event" => 'updated',
				"properties" => wp_json_encode($properties),
				"created_at" => current_time('mysql'),
			];
			$activityLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
			$db->insert($activityLogTable, $activityLogArg);
		}

		// Return the updated project
		$data =  $this->getProjectById($id);
		if($data){
			return new WP_REST_Response(['status'=>200, 'message'=>'Project updated successfully', 'data'=>$data, 'ids'=>$ids, 'requestData'=>$requestData], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Project not found', 'data'=>[]], 404);
	}


	public function delete(WP_REST_Request $request){

		// Sanitize and validate the input data
		$id = $request->get_param('id');
		$requestData = $request->get_json_params();
		$deleted_at = current_time('mysql');

		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$db->query('START TRANSACTION');
		$deletedBy = isset($requestData['deleted_by']) && $requestData['deleted_by']!="" ? $requestData['deleted_by'] : null;

		//members and tasks check
		$projectMembers = $this->getProjectMembers($id);

		if($projectMembers && sizeof($projectMembers) > 0 && isset($projectMembers[$id]) && sizeof($projectMembers[$id])>0){
			$db->query('ROLLBACK');
				return new WP_REST_Response(['status'=>404, 'message'=>'Project has members','data'=>null]);
		}

		$projectTasks = $this->getNoOfTasksByProject($id);
		$totalTasks = $projectTasks && isset($projectTasks[$id]) ? (int)$projectTasks[$id]:0;
		if($totalTasks>0){
			$db->query('ROLLBACK');
				return new WP_REST_Response(['status'=>404, 'message'=>'Project has tasks', 'data'=>null]);
		}

		$projectUpdated = $db->update(
			self::TABLE_PROJECTS,
			array(
				"deleted_by" => (int)$deletedBy,
				"deleted_at" => $deleted_at,
				"status" => 0,
			),
			array( 'id' => $id )
		);

		if (!$projectUpdated) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_REST_Response(['status'=>404, 'message'=>'Project not found', 'data'=>null], 404);
		}

		$properties['attributes'] = [
			'deleted_by' => $deletedBy,
			'deleted_at' => $deleted_at,
			'status' => 0,
		];
		$activityLogArg = [
			"user_id" => $deletedBy,
			"subject_id" => $id,
			"subject_name" => 'project',
			"subject_type" => 'project',
			"event" => 'deleted',
			"properties" => wp_json_encode($properties),
			"created_at" => current_time('mysql'),
		];
		$activityLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
		$db->insert($activityLogTable, $activityLogArg);

		$db->query('COMMIT');
		$data = $this->getProjectById($id);
		// Return a success message
		if($data){
			return new WP_REST_Response(['status'=>200, 'message'=>'Project deleted successfully', 'data'=>$data], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Project not found', 'data'=>null], 404);
	}

	// Function for project archive
	public function archiveProject(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$projectsTable = LAZYTASK_TABLE_PREFIX . 'projects';

		// Sanitize and validate the input data
		$id = $request->get_param('id');
		$requestData = $request->get_json_params();
		$deletedBy = isset($requestData['updated_by']) && $requestData['updated_by']!="" ? $requestData['updated_by'] : null;
		$archived_at = current_time('mysql');

		if(!$id){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required', 'data'=>null], 404);
		}

		$project = $this->getProjectById($id);
		if(!$project){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project not found', 'data'=>null], 404);
		}

		$updated = $db->update(
			$projectsTable,
			array(
				"status" => 2, // Set status to archived
				"updated_at" => $archived_at,
			),
			array( 'id' => $id )
		);

		$projectInfo =  $this->getProjectById($id);
		if($projectInfo){
			$companyController = new Lazytask_CompanyController();
			$company = $companyController->getCompanyById($projectInfo['company_id'], $request);
			$projectInfo['parent'] = $company;
			return new WP_REST_Response(['status'=>200, 'message'=>'Project Archived successfully', 'projectInfo'=>$projectInfo,], 200);
		}

	}
	
	// Function for project unarchive
	public function unarchiveProject(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$projectsTable = LAZYTASK_TABLE_PREFIX . 'projects';

		// Sanitize and validate the input data
		$id = $request->get_param('id');
		$requestData = $request->get_json_params();
		$deletedBy = isset($requestData['updated_by']) && $requestData['updated_by']!="" ? $requestData['updated_by'] : null;
		$archived_at = current_time('mysql');

		if(!$id){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required', 'data'=>null], 404);
		}

		$project = $this->getProjectById($id);
		if(!$project){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project not found', 'data'=>null], 404);
		}

		$updated = $db->update(
			$projectsTable,
			array(
				"status" => 1, // Set status to archived
				"updated_at" => $archived_at,
			),
			array( 'id' => $id )
		);

		$projectInfo =  $this->getProjectById($id);
		if($projectInfo){
			$companyController = new Lazytask_CompanyController();
			$company = $companyController->getCompanyById($projectInfo['company_id'], $request);
			$projectInfo['parent'] = $company;
			return new WP_REST_Response(['status'=>200, 'message'=>'Project Unarchived successfully', 'projectInfo'=>$projectInfo,], 200);
		}

	}

	public function getProjectById($projectId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$projectsTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';
		$project = $db->get_row(
			$db->prepare(
				"SELECT projects.id, projects.name, projects.slug, projects.code, projects.status, projects.settings, projects.company_id, company.name as companyName 
					FROM `{$projectsTable}` as projects
					JOIN `{$companyTable}` as company  ON projects.company_id = company.id 
					WHERE projects.id = %d", (int)$projectId), ARRAY_A);
		if($project){
			$companyController = new Lazytask_CompanyController();
			$companyMembers = $companyController->getCompanyMembers($project['company_id']);

			$projectStatus = '';
			if($project['status'] == 1){
				$projectStatus = 'active';
			}else if($project['status'] == 2){
				$projectStatus = 'archived';
			}else{
				$projectStatus = 'inactive';
			}

			$projectMembers = $this->getProjectMembers($projectId);
			$projectInvitedMembers = $this->getProjectInvitedMembers($projectId);
			$projectTasks = $this->getNoOfTasksByProject($projectId);
			$projectPriorities = Lazytask_DatabaseQuerySchema::getProjectPriorities($projectId);
			$projectStatuses = Lazytask_DatabaseQuerySchema::getProjectStatus($projectId);
			$project['members'] = $projectMembers[ $projectId ] ?? [];
			$project['invitedMembers'] = $projectInvitedMembers[ $projectId ] ?? [];
			$project['parent'] = ['id'=>$project['company_id'], 'name'=>$project['companyName'], 'members'=> isset($companyMembers[ $project['company_id'] ]) && sizeof($companyMembers[ $project['company_id'] ]) >0 ? $companyMembers[ $project['company_id'] ] :[]];
			$project['projectPriorities'] = $projectPriorities;
			$project['projectStatuses'] = $projectStatuses;
			$project['total_tasks'] = isset($projectTasks[$projectId]) ? $projectTasks[$projectId] : '0';
			$project['status_name'] = $projectStatus;

			return $project;
		}

		return null;
	}

	public function getProjectsByIds($projectsId) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$projectsTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';


		if (is_array($projectsId)) {
			$ids = implode(', ', array_fill(0, count($projectsId), '%s'));
		}else{
			$ids = '%s';
			$projectsId = [$projectsId];
		}

		$sql = "SELECT projects.id, projects.name, projects.slug, projects.code, projects.status, projects.company_id, company.name as companyName FROM `{$projectsTable}` as projects
			JOIN `{$companyTable}` as company  ON projects.company_id = company.id 
		WHERE projects.id IN ($ids)";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $projectsId));

		$projects = $db->get_results($db->prepare(
			$query
		), ARRAY_A);

		if($projects && sizeof($projects)){
			$companyController = new Lazytask_CompanyController();
			$companyMembers = $companyController->getCompanyMembers(array_unique(array_column($projects, 'company_id')));

			$projectMembers = $this->getProjectMembers(array_unique(array_column( $projects, 'id')));

			$returnArray = [];
			foreach ($projects as $key => $project) {
				$projectPriorities = Lazytask_DatabaseQuerySchema::getProjectPriorities($project['id']);
				$projectStatuses = Lazytask_DatabaseQuerySchema::getProjectStatus($project['id']);
				$project['members'] = isset($projectMembers[$project['id']])? $projectMembers[$project['id']] : [];
				$project['parent'] = ['id'=>$project['company_id'], 'name'=>$project['companyName'], 'members'=> isset($companyMembers[ $project['company_id'] ]) && sizeof($companyMembers[ $project['company_id'] ]) >0 ? $companyMembers[ $project['company_id'] ] :[]];
				$project['projectPriorities'] = $projectPriorities;
				$project['projectStatuses'] = $projectStatuses;
				$returnArray[$project['id']]=$project;
			}

			return $returnArray;
		}

		return null;
	}

	public function getProjectMembers($projectsId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		if($projectsId == ''){
			return [];
		}
		$usersTable = $wpdb->prefix . 'users';
		$projectMembersTable = LAZYTASK_TABLE_PREFIX . 'projects_users';

		if (is_array($projectsId)) {
			$ids = implode(', ', array_fill(0, count($projectsId), '%s'));
		}else{
			$ids = '%s';
			$projectsId = [$projectsId];
		}

		$sql = "SELECT * FROM `{$usersTable}` as users
			JOIN `{$projectMembersTable}` as projectMembers  ON users.ID = projectMembers.user_id 
		WHERE projectMembers.project_id IN ($ids)";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $projectsId));
		$results = $db->get_results($db->prepare(
			$query
		), ARRAY_A);

		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				//get user->roles
				$user = get_userdata($value['ID']);
				$user_roles = $user ? $user->roles : [];
				$is_wp_admin = $user && in_array('administrator', $user_roles);
				
				if( $user && $user_roles && in_array('lazytasks_role', $user_roles) && $user->user_status == 0) {
					continue;
				}

				$lazytaskRoles = get_user_meta($value['ID'], 'lazytasks_capabilities', true);

				$returnArray[$value['project_id']][] = [
					'id' => $value['ID'],
					'name' => $value['display_name'],
					'email' => $value['user_email'],
					'username' => $value['user_login'],
					'created_at' => $value['user_registered'],
					'user_status' => $value['user_status'],
					'avatar' => Lazytask_UserController::getUserAvatar($value['ID']),
					'lazytasks_role' => $lazytaskRoles,
					'is_wp_admin' => $is_wp_admin,
				];
			}
		}
		return $returnArray;
	}
	
	public function getProjectInvitedMembers($projectsId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		if($projectsId == ''){
			return [];
		}
		$usersTable = $wpdb->prefix . 'users';
		$projectMembersTable = LAZYTASK_TABLE_PREFIX . 'projects_users';

		if (is_array($projectsId)) {
			$ids = implode(', ', array_fill(0, count($projectsId), '%s'));
		}else{
			$ids = '%s';
			$projectsId = [$projectsId];
		}

		$sql = "SELECT * FROM `{$usersTable}` as users
			JOIN `{$projectMembersTable}` as projectMembers  ON users.ID = projectMembers.user_id 
		WHERE projectMembers.project_id IN ($ids)";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $projectsId));
		$results = $db->get_results($db->prepare(
			$query
		), ARRAY_A);

		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				//get user->roles
				$user = get_userdata($value['ID']);
				$user_roles = $user->roles;
				if( $user && $user_roles && in_array('lazytasks_role', $user_roles) && $user->user_status == 0) {
					$returnArray[$value['project_id']][] = [
						'id' => $value['ID'],
						'name' => $value['display_name'],
						'email' => $value['user_email'],
						'username' => $value['user_login'],
						'created_at' => $value['user_registered'],
						'user_status' => $value['user_status'],
						'avatar' => Lazytask_UserController::getUserAvatar($value['ID']),
						//'lazytasks_role' => $lazytaskRoles,
					];
				}else{
					continue;
				}

				// $lazytaskRoles = get_user_meta($value['ID'], 'lazytasks_capabilities', true);

				
			}
		}
		return $returnArray;
	}

	public function getNoOfTasksByProject($projectsId, $groupByStatus = false){
		global $wpdb;

		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		if($projectsId == ''){
			return [];
		}
		if(is_array($projectsId) && sizeof($projectsId) == 0){
			return [];
		}
		$tableTask = LAZYTASK_TABLE_PREFIX . 'tasks';
		$tableProjects = LAZYTASK_TABLE_PREFIX . 'projects';

		if (is_array($projectsId)) {
			$ids = implode(', ', array_fill(0, count($projectsId), '%s'));
		}else{
			$ids = '%s';
			$projectsId = [$projectsId];
		}

		$sql = "SELECT SUM(CASE 
					WHEN task.status NOT IN ('ARCHIVED_A', 'ARCHIVED_C') 
					THEN 1 ELSE 0 
				END) AS totalRecords, 
				SUM(CASE 
                WHEN task.end_date < NOW() 
                     AND task.status NOT IN ('COMPLETED', 'ARCHIVED_A', 'ARCHIVED_C') 
                THEN 1 ELSE 0 
            END) AS overdueTasks, projects.id as project_id, task.status as status FROM `{$tableTask}` as task
			JOIN `{$tableProjects}` as projects  ON projects.id = task.project_id
		WHERE task.deleted_at IS NULL AND projects.id IN ($ids) group by projects.id";

		if($groupByStatus){
			$sql .= " , task.status";
		}

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $projectsId));
		$results = $db->get_results($query, ARRAY_A);

		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				if($groupByStatus){
					$returnArray['statusData'][$value['status']] = $value['status'];
					$returnArray['recordData'][$value['project_id']][$value['status']] = $value['totalRecords'];
					if (!isset($returnArray['recordData'][$value['project_id']]['OVERDUE'])) {
						$returnArray['recordData'][$value['project_id']]['OVERDUE'] = 0;
					}
					$returnArray['recordData'][$value['project_id']]['OVERDUE'] += (int)$value['overdueTasks'];
				}else{
					$returnArray[$value['project_id']] = $value['totalRecords'];
				}
			}
		}
		return $returnArray;
	}

	public function createProjectPriority(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$id = $requestData['id'];
		$projectId = $requestData['project_id'];
		$name = sanitize_text_field($requestData['name']);
		$color_code = isset($requestData['color_code']) && $requestData['color_code']!="" ? $requestData['color_code'] : '#000000';
		$sort_order = isset($requestData['sort_order']) && $requestData['sort_order']!="" ? $requestData['sort_order'] : 1;
		$created_by = isset($requestData['created_by']) && $requestData['created_by']!="" ? $requestData['created_by'] : null; // get current user id (logged in user id
		$created_at = current_time('mysql');

		// Get max sort_order for the project
		$priorityTable = LAZYTASK_TABLE_PREFIX . 'project_priorities';
		$maxSortOrder = $db->get_var($db->prepare(
			"SELECT MAX(sort_order) FROM {$priorityTable} WHERE project_id = %d",
			$projectId
		));
		
		// Set new sort_order as max + 1
		$sort_order = $maxSortOrder ? $maxSortOrder + 1 : 1;

		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project is required', 'data'=>null], 404);
		}
		if($name == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Name is required', 'data'=>null], 404);
		}
		//id is exit then update
		if ( $id ){
			$projectPriority = Lazytask_DatabaseQuerySchema::getProjectPriorityById($id, $projectId);
			if($projectPriority){
				$updated = $db->update(
					LAZYTASK_TABLE_PREFIX . 'project_priorities',
					array(
						"name" => $name,
						"color_code" => $color_code,
						"updated_at" => $created_at,
						"updated_by" => $created_by,
					),
					array( 'id' => $projectPriority['id'] )
				);
				if($updated){
					$data =  Lazytask_DatabaseQuerySchema::getProjectPriorities($projectId);
					if($data){
						return new WP_REST_Response(['status'=>200, 'message'=>'Project priority updated successfully', 'data'=>$data], 200);
					}
				}
			}
			return new WP_REST_Response(['status'=>404, 'message'=>'Project priority not found', 'data'=>null], 404);
		}

		$db->insert(LAZYTASK_TABLE_PREFIX . 'project_priorities', array(
			"project_id" => $projectId,
			"name" => $name,
			"color_code" => $color_code,
			"sort_order" => $sort_order,
			"created_at" => $created_at,
			"created_by" => $created_by,
		));
		$priorityId = $wpdb->insert_id;
		if($priorityId && $projectId){
			$data =  Lazytask_DatabaseQuerySchema::getProjectPriorities($projectId);
			if($data){
				return new WP_REST_Response(['status'=>200, 'message'=>'Project priority created successfully', 'data'=>$data], 200);
			}
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Project priority not found', 'data'=>null], 404);

	}

	// update project priority sort reorder
	public function updateProjectPrioritySortOrder(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$requestData = $request->get_json_params();

		$projectId = $requestData['project_id'];
		$sortOrder = $requestData['sort_order'];

		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required', 'data'=>null], 404);
		}
		if($sortOrder == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Sort order is required', 'data'=>null], 404);
		}

		foreach ($sortOrder as $key => $value) {
			if(isset($value['id']) && isset($value['sort_order'])){
				$db->update(
					LAZYTASK_TABLE_PREFIX . 'project_priorities',
					array(
						"sort_order" => (int)$value['sort_order'],
					),
					array( 'id' => (int)$value['id'] )
				);
			}
		}

		$priorityTable = LAZYTASK_TABLE_PREFIX . 'project_priorities';
		$results = $db->get_results(
			$db->prepare(
				"SELECT id, name, project_id, color_code, sort_order 
				FROM {$priorityTable} 
				WHERE project_id = %d 
				ORDER BY sort_order ASC",
				$projectId
			),
			ARRAY_A
		);
		return new WP_REST_Response(['status'=>200, 'message'=>'Project priority sorted successfully', 'data'=>$results], 200);
	}

	//delete project priority
	public function deleteProjectPriority(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$requestData = $request->get_params();
		$priorityId = $requestData['id'];
		$projectId = $requestData['project_id'];
		$taskId = $requestData['taskId'];

		if($priorityId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Priority ID is required', 'data'=>null], 404);
		}
		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required', 'data'=>null], 404);
		}

		$projectPriority = Lazytask_DatabaseQuerySchema::getProjectPriorityById($priorityId, $projectId);
		if($projectPriority){

			//check if any task is assigned with this priority not this taskId
			$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
			$task = $db->get_row(
				$db->prepare(
					"SELECT id FROM `{$taskTable}` WHERE deleted_at IS NULL AND project_id = %d AND priority_id = %d", (int)$projectId, (int)$priorityId), ARRAY_A);

			if($task){
				$data =  Lazytask_DatabaseQuerySchema::getProjectPriorities($projectId);
				return new WP_REST_Response(['status'=>400, 'message'=>'Task is assigned with this priority', 'data'=>$data], 200);
			}

			//hard remove project priority
			$deleted = $db->delete(LAZYTASK_TABLE_PREFIX . 'project_priorities', array('id' => $projectPriority['id']));

			if($deleted){
				$data =  Lazytask_DatabaseQuerySchema::getProjectPriorities($projectId);
				if($data){
					return new WP_REST_Response(['status'=>200, 'message'=>'Project priority deleted successfully', 'data'=>$data], 200);
				}
			}
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Project priority not found', 'data'=>null], 404);
	}

	public function getPrioritiesByProjectId(WP_REST_Request $request){
		$projectId = $request->get_param( 'id' );
		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required', 'data'=>[]], 200);
		}
		$data = Lazytask_DatabaseQuerySchema::getProjectPriorities($projectId);
		if($data && sizeof($data)>0){
			return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$data], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'No record found', 'data'=>[]], 200);
	}

	// project statu sections
	public function createProjectStatus(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$requestData = $request->get_json_params();
		$id = $requestData['id'];
		$projectId = $requestData['project_id'];
		$name = sanitize_text_field($requestData['name']);
		$color_code = isset($requestData['color_code']) && $requestData['color_code']!="" ? $requestData['color_code'] : '#000000';
		$sort_order = isset($requestData['sort_order']) && $requestData['sort_order']!="" ? $requestData['sort_order'] : 1;
		$created_by = isset($requestData['created_by']) && $requestData['created_by']!="" ? $requestData['created_by'] : null; // get current user id (logged in user id
		$created_at = current_time('mysql');

		// Get max sort_order for the project
		$statusTable = LAZYTASK_TABLE_PREFIX . 'project_statuses';
		$maxSortOrder = $db->get_var($db->prepare(
			"SELECT MAX(sort_order) FROM {$statusTable} WHERE project_id = %d",
			$projectId
		));
		
		// Set new sort_order as max + 1
		$sort_order = $maxSortOrder ? $maxSortOrder + 1 : 1;

		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project is required', 'data'=>null], 404);
		}
		if($name == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Name is required', 'data'=>null], 404);
		}
		//id is exit then update
		if ( $id ){
			$projectStatus = Lazytask_DatabaseQuerySchema::getProjectStatusById($id, $projectId);
			if($projectStatus){
				$updated = $db->update(
					LAZYTASK_TABLE_PREFIX . 'project_statuses',
					array(
						"name" => $name,
						"slug" => strtolower(str_replace(' ', '-', $name)),
						"is_active" => 1,
						"color_code" => $color_code,
						"updated_at" => $created_at,
						"updated_by" => $created_by,
					),
					array( 'id' => $projectStatus['id'] )
				);
				if($updated){
					$data =  Lazytask_DatabaseQuerySchema::getProjectStatus($projectId);
					if($data){
						return new WP_REST_Response(['status'=>200, 'message'=>'Project status updated successfully', 'data'=>$data], 200);
					}
				}
			}
			return new WP_REST_Response(['status'=>404, 'message'=>'Project status not found', 'data'=>null], 404);
		}

		$db->insert(LAZYTASK_TABLE_PREFIX . 'project_statuses', array(
			"project_id" => $projectId,
			"name" => $name,
			"slug" => strtolower(str_replace(' ', '-', $name)),
			"color_code" => $color_code,
			"sort_order" => $sort_order,
			"is_active" => 1,
			"created_at" => $created_at,
			"created_by" => $created_by,
		));
		$statusId = $wpdb->insert_id;
		if($statusId && $projectId){
			$data =  Lazytask_DatabaseQuerySchema::getProjectStatus($projectId);
			if($data){
				return new WP_REST_Response(['status'=>200, 'message'=>'Project status created successfully', 'data'=>$data], 200);
			}
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Project status not found', 'data'=>null], 404);

	}

	//delete project status
	public function deleteProjectStatus(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$requestData = $request->get_params();
		$statusId = $requestData['id'];
		$projectId = $requestData['project_id'];
		$taskId = $requestData['taskId'];
		$deleted_at = current_time('mysql');

		if($statusId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Status ID is required', 'data'=>null], 404);
		}
		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required', 'data'=>null], 404);
		}

		$projectStatus = Lazytask_DatabaseQuerySchema::getProjectStatusById($statusId, $projectId);
		if($projectStatus){

			//check if any task is assigned with this status not this taskId
			$taskTable = LAZYTASK_TABLE_PREFIX . 'tasks';
			$task = $db->get_row(
				$db->prepare(
					"SELECT id FROM `{$taskTable}` WHERE deleted_at IS NULL AND project_id = %d AND internal_status_id = %d", (int)$projectId, (int)$statusId), ARRAY_A);

			if($task){
				$data =  Lazytask_DatabaseQuerySchema::getProjectStatus($projectId);
				return new WP_REST_Response(['status'=>400, 'message'=>'Task is assigned with this status', 'data'=>$data], 200);
			}

			$tableProjectStatuses = LAZYTASK_TABLE_PREFIX . 'project_statuses';
			//hard remove project priority
			// $deleted = $db->delete(LAZYTASK_TABLE_PREFIX . 'project_statuses', array('id' => $projectStatus['id']));
			$deleted = $db->update(
				$tableProjectStatuses,
				array(
					"deleted_at" => $deleted_at,
				),
				array('id' => $projectStatus['id'])
			);

			if($deleted){
				$data =  Lazytask_DatabaseQuerySchema::getProjectStatus($projectId);
				if($data){
					return new WP_REST_Response(['status'=>200, 'message'=>'Project status deleted successfully', 'data'=>$data], 200);
				}
			}
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Project status not found', 'data'=>null], 404);
	}

	// update project priority sort reorder
	public function updateProjectStatusSortOrder(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$requestData = $request->get_json_params();

		$projectId = $requestData['project_id'];
		$sortOrder = $requestData['sort_order'];

		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required', 'data'=>null], 404);
		}
		if($sortOrder == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Sort order is required', 'data'=>null], 404);
		}

		foreach ($sortOrder as $key => $value) {
			if(isset($value['id']) && isset($value['sort_order'])){
				$db->update(
					LAZYTASK_TABLE_PREFIX . 'project_statuses',
					array(
						"sort_order" => (int)$value['sort_order'],
					),
					array( 'id' => (int)$value['id'] )
				);
			}
		}

		$statusTable = LAZYTASK_TABLE_PREFIX . 'project_statuses';
		$results = $db->get_results(
			$db->prepare(
				"SELECT id, name, project_id, color_code, sort_order 
				FROM {$statusTable} 
				WHERE project_id = %d AND is_active = 1 AND deleted_at IS NULL
				ORDER BY sort_order ASC",
				$projectId
			),
			ARRAY_A
		);
		return new WP_REST_Response(['status'=>200, 'message'=>'Project status sorted successfully', 'data'=>$results], 200);
	}

	public function getStatusByProjectId(WP_REST_Request $request){
		$projectId = $request->get_param( 'id' );
		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required', 'data'=>[]], 200);
		}
		$data = Lazytask_DatabaseQuerySchema::getProjectStatus($projectId);
		if($data && sizeof($data)>0){
			return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$data], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'No record found', 'data'=>[]], 200);
	}

	public function getTasksByProjectId(WP_REST_Request $request){
		global $wpdb;
		$projectId = $request->get_param( 'id' );
		$requestData = $request->get_params();
		$project = $this->getProjectById($projectId);


		$returnArray = [];
		if ($project){

			$companyController = new Lazytask_CompanyController();
			$company = $companyController->getCompanyById($project['company_id'], $request);

			$projectTaskSections = Lazytask_DatabaseQuerySchema::getTaskSectionsByProjectId($project['id']);
			$taskSections = array_unique(array_column($projectTaskSections, 'slug'));

			$taskController = new Lazytask_TaskController();
			$tasks = $taskController->getTasksByProjectId($project['id'], $requestData);
			
			$sectionData = null;
			if(isset($tasks['sectionData']) && sizeof($tasks['sectionData'])>0){
				foreach ($taskSections as $section) {
					$sectionData[$section] = isset($tasks['sectionData'][$section]) ? $tasks['sectionData'][$section] : [];
				}
			}

			$project['parent'] = $company;

			$projectNavbar = [];
			if (!empty($project['settings'])) {
				$settings = json_decode($project['settings'], true);
				if (isset($settings['navbar'])) {
					$projectNavbar = $settings['navbar'];
				}
			}

			$returnArray['projectInfo'] = $project;
			$returnArray['projectPriorities'] = $project['projectPriorities'];
			$returnArray['projectStatuses'] = $project['projectStatuses'];
			$returnArray['taskSections'] = $taskSections;
			$returnArray['taskListSectionsName'] = $projectTaskSections && sizeof($projectTaskSections)>0 ? $projectTaskSections : null;
			$returnArray['tasks'] = $sectionData;
			$returnArray['allTasks'] = isset($tasks['taskData']) ? $tasks['taskData'] : null;
			$returnArray['childTasks'] = isset($tasks['childData']) ? $tasks['childData'] : null;
			$returnArray['projectNavbar'] = $projectNavbar;

			return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $returnArray], 200);

		}
		return new WP_REST_Response(['status'=>404, 'message'=>'No record found','data' => null], 200);
	}


	public function getTaskSectionsByProjectId(WP_REST_Request $request){
		$projectId = $request->get_param( 'id' );
		if($projectId == ''){
			return new WP_REST_Response(['status'=>404, 'message'=>'Project ID is required','data' => []], 200);
		}
		$data = Lazytask_DatabaseQuerySchema::getTaskSectionsByProjectId($projectId);
		if($data && sizeof($data)>0){
			$arrayValues = array_values($data);
			return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $arrayValues], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'No record found','data' => []], 200);
	}

	// get projects by user id and company id
	public function getProjectsByUserIdAndCompanyId($userId, $companiesId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$projectsTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';
		$projectMembersTable = LAZYTASK_TABLE_PREFIX . 'projects_users';
		$ids = implode(', ', array_fill(0, count($companiesId), '%s'));

		$sql = "SELECT projects.* 
				FROM `{$projectsTable}` as projects
				JOIN `{$companyTable}` as company  ON projects.company_id = company.id 
				JOIN `{$projectMembersTable}` as projectMembers  ON projects.id = projectMembers.project_id 
				WHERE projects.deleted_at IS NULL and projectMembers.user_id = %d AND projects.company_id IN ($ids) group by projects.id";
		//call_user_func_array with user id
		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql, $userId), $companiesId));
		$results = $db->get_results($query, ARRAY_A);
		$returnArray = [];
		if($results && count($results) > 0){
			$projectsId = array_column($results, 'id');
			$projectController = new Lazytask_ProjectController();
			$projectMembers = $projectController->getProjectMembers($projectsId);
			$projectTasks = $projectController->getNoOfTasksByProject($projectsId);

			foreach ($results as $key => $value) {
				$returnArray[$value['company_id']][] = [
					'id' => $value['id'],
					'name' => $value['name'],
					'slug' => $value['slug'],
					'code' => $value['code'],
					'status' => $value['status'],
					'members' => isset($projectMembers[ $value['id'] ]) ? $projectMembers[ $value['id'] ] :[],
					'total_tasks' => isset($projectTasks[ $value['id'] ]) ? $projectTasks[ $value['id'] ] : '0',
				];
			}
		}
		return $returnArray;
	}


	public function getGanttTasksByProjectId(WP_REST_Request $request){
		global $wpdb;
		$projectId = $request->get_param( 'id' );
		$requestData = $request->get_params();
		$project = $this->getProjectById($projectId);


		$returnArray = [];
		if ($project){
			$companyController = new Lazytask_CompanyController();
			$company = $companyController->getCompanyById($project['company_id'], $request);

			$project['parent'] = $company;


			$projectStatuses = $project['projectStatuses'];
			$projectPriorities = $project['projectPriorities'];

			$projectNavbar = [];
			if (!empty($project['settings'])) {
				$settings = json_decode($project['settings'], true);
				if (isset($settings['navbar'])) {
					$projectNavbar = $settings['navbar'];
				}
			}

			$taskController = new Lazytask_TaskController();
			$tasks = $taskController->getGanttTasksByProjectId($project['id'], $requestData);

			$returnArray['projectInfo'] = $project;
			$returnArray['projectPriorities'] = $projectPriorities;
			$returnArray['projectStatuses'] = $projectStatuses;
			$returnArray['ganttTasks'] = $tasks;
			$returnArray['projectNavbar'] = $projectNavbar;

			return new WP_REST_Response(['status'=>200, 'message'=>'Success','data' => $returnArray], 200);

		}
		return new WP_REST_Response(['status'=>404, 'message'=>'No record found','data' => null], 200);
	}

	public function getProjectOverview(WP_REST_Request $request)
	{
		global $wpdb;
		$projectId = $request->get_param('id');
		$project = $this->getProjectById($projectId);
		// $requestData = $request->get_params();

		if (!$project) {
			return new WP_REST_Response(['status' => 404, 'message' => 'No project found', 'data' => null], 200);
		}

		$companyController = new Lazytask_CompanyController();
		$company = $companyController->getCompanyById($project['company_id'], $request);
		$project['parent'] = $company;

		$projectTaskSections = Lazytask_DatabaseQuerySchema::getTaskSectionsByProjectId($project['id']);
		$taskSections = array_unique(array_column($projectTaskSections, 'slug'));

		$projectNavbar = [];
		if (!empty($project['settings'])) {
			$settings = json_decode($project['settings'], true);
			if (isset($settings['navbar'])) {
				$projectNavbar = $settings['navbar'];
			}
		}

		$response = [
			'projectInfo' => $project,
			'projectPriorities' => $project['projectPriorities'],
			'projectStatuses' => $project['projectStatuses'],
			'taskSections' => $taskSections,
			'taskListSectionsName' => $projectTaskSections,
			'projectNavbar' => $projectNavbar
		];

		return new WP_REST_Response(['status' => 200, 'message' => 'Success', 'data' => $response], 200);
	}

	public function getTasksBySection(WP_REST_Request $request)
	{
		global $wpdb;

		$projectId = (int) $request->get_param('project_id');
		$sectionSlug = trim(sanitize_text_field($request->get_param('section_slug')));
		$limit = (int) $request->get_param('limit') ?: 10;
		$offset = (int) $request->get_param('offset') ?: 0;

		// Step 1: Get section ID from slug
		$section = $wpdb->get_row($wpdb->prepare(
			"SELECT id FROM {$wpdb->prefix}pms_task_sections WHERE slug = %s AND project_id = %d",
			$sectionSlug,
			$projectId
		));

		if (!$section) {
			return new WP_REST_Response(['status' => 404, 'message' => 'Section not found', 'data' => null], 200);
		}

		$requestData = [
			'section_id' => $section->id,
			'limit' => $limit,
			'offset' => $offset
		];

		$taskController = new Lazytask_TaskController();
		$tasks = $taskController->getPaginatedTasksByProjectId($projectId, $requestData);

		// Return only tasks from this section
		$sectionTasks = $tasks['sectionData'][$sectionSlug] ?? [];
		$childTasks = $tasks['childData'] ?? [];
		$hasMore = $tasks['hasMore'];

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Section tasks loaded',
			'data' => [
				'sectionSlug' => $sectionSlug,
				'slugMatchKeys' => array_keys($tasks['sectionData'] ?? []),
				'tasks' => $sectionTasks,
				'childTasks' => $childTasks,
				'hasMore' => $hasMore,
			]
		], 200);
	}
	
	public function getTasksByPriority(WP_REST_Request $request)
	{
		global $wpdb;

		$projectId = (int) $request->get_param('project_id');
		$priorityId = $request->get_param('priority_id');
		$limit = (int) $request->get_param('limit') ?: 10;
		$offset = (int) $request->get_param('offset') ?: 0;

		// Basic slug generator
		$make_slug = function($string) {
			$slug = strtolower($string);
			$slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
			return trim($slug, '-');
		};

		if ($priorityId === 'none' || $priorityId === 'null') {
			$priorityName = 'No Priority';
			$prioritySlug = 'no-priority';
			$responsePriorityId = 'no-priority';
			$requestData = [
				'priority_id' => 'none',
				'limit' => $limit,
				'offset' => $offset
			];
		}else{
			$priority = $wpdb->get_row($wpdb->prepare(
				"SELECT id, name, color_code FROM {$wpdb->prefix}pms_project_priorities WHERE id = %d AND project_id = %d",
				$priorityId,
				$projectId
			));
	
			if (!$priority) {
				return new WP_REST_Response(['status' => 404, 'message' => 'Priority not found', 'data' => null], 200);
			}

			$priorityName = $priority->name;
			$baseSlug = $make_slug($priority->name);
            $prioritySlug = $baseSlug . '-' . $priority->id;
			$responsePriorityId = $priority->id;
	
			$requestData = [
				'priority_id' => $priority->id,
				'limit' => $limit,
				'offset' => $offset
			];
		}

		

		$taskController = new Lazytask_TaskController();
		$tasks = $taskController->getPaginatedTasks($projectId, $requestData, 'priority');

		// Return only tasks from this section
		if ($priorityId === 'none' || $priorityId === 'null') {
			$sectionTasks = $tasks['priorityData']['no-priority'] ?? [];
		} else {
			$sectionTasks = $tasks['priorityData'][$priorityId] ?? [];
		}
		$childTasks = $tasks['childData'] ?? [];
		$hasMore = $tasks['hasMore'];

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Priority tasks loaded',
			'data' => [
				'priorityId' => $responsePriorityId,
				'priorityName' => $priorityName,
				'prioritySlug' => $prioritySlug,
				'tasks' => $sectionTasks,
				'childTasks' => $childTasks,
				'hasMore' => $hasMore,
			]
		], 200);
	}
	
	public function getTasksByStatus(WP_REST_Request $request)
	{
		global $wpdb;

		$projectId = (int) $request->get_param('project_id');
		$statusId = $request->get_param('status_id');
		$limit = (int) $request->get_param('limit') ?: 10;
		$offset = (int) $request->get_param('offset') ?: 0;

		if ($statusId === 'none' || $statusId === 'null') {
			$statusName = 'No Status';
			$statusSlug = 'no-status';
			$responseStatusId = 'no-status';
			$requestData = [
				'internal_status_id' => 'none',
				'limit' => $limit,
				'offset' => $offset
			];
		}else{

			$status = $wpdb->get_row($wpdb->prepare(
				"SELECT id, name, color_code, slug FROM {$wpdb->prefix}pms_project_statuses WHERE id = %d AND project_id = %d",
				$statusId,
				$projectId
			));

			if (!$status) {
				return new WP_REST_Response(['status' => 404, 'message' => 'Status not found', 'data' => null], 200);
			}

			$statusName = $status->name;
			$statusSlug = $status->slug.'-'.$status->id;
			$responseStatusId = $status->id;

			$requestData = [
				'internal_status_id' => $status->id,
				'limit' => $limit,
				'offset' => $offset
			];
		}

		$taskController = new Lazytask_TaskController();
		$tasks = $taskController->getPaginatedTasks($projectId, $requestData, 'status');

		// Return only tasks from this section
		if($statusId === 'none' || $statusId === 'null') {
			$sectionTasks = $tasks['statusData']['no-status'] ?? [];
		} else {
			$sectionTasks = $tasks['statusData'][$statusId] ?? [];
		}
		$childTasks = $tasks['childData'] ?? [];
		$hasMore = $tasks['hasMore'];

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Tasks loaded',
			'data' => [
				'statusId' => $responseStatusId,
				'statusName' => $statusName,
				'statusSlug' => $statusSlug,
				'tasks' => $sectionTasks,
				'childTasks' => $childTasks,
				'hasMore' => $hasMore,
			]
		], 200);
	}
	
	public function getTasksByMember(WP_REST_Request $request)
	{
		global $wpdb;

		$projectId = (int) $request->get_param('project_id');
		$memberId = $request->get_param('member_id');
		$limit = (int) $request->get_param('limit') ?: 10;
		$offset = (int) $request->get_param('offset') ?: 0;

		if ($memberId === 'none' || $memberId === 'null') {
			$memberName = 'Unassigned';
			$responseMemberId = 'no-assigned';
			$requestData = [
				'assigned_to' => 'none',
				'limit' => $limit,
				'offset' => $offset
			];
		}else{

			$member = $wpdb->get_row($wpdb->prepare(
				"SELECT id, display_name FROM {$wpdb->prefix}users WHERE id = %d",
				$memberId
			));
	
			if (!$member) {
				return new WP_REST_Response(['status' => 404, 'message' => 'Member not found', 'data' => null], 200);
			}
			
			$memberName = $member->display_name;
			$responseMemberId = $member->id;
			$requestData = [
				'assigned_to' => $member->id,
				'limit' => $limit,
				'offset' => $offset
			];
		}

		$taskController = new Lazytask_TaskController();
		$tasks = $taskController->getPaginatedTasks($projectId, $requestData, 'member');

		// Return only tasks from this section
		if ($memberId === 'none' || $memberId === 'null') {
			$sectionTasks = $tasks['memberData']['no-assigned'] ?? [];
		}else{
			$sectionTasks = $tasks['memberData'][$memberId] ?? [];
		}
		$childTasks = $tasks['childData'] ?? [];
		$hasMore = $tasks['hasMore'];

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Tasks loaded',
			'data' => [
				'memberId' => $responseMemberId,
				'member_name' => $memberName,
				'tasks' => $sectionTasks,
				'childTasks' => $childTasks,
				'hasMore' => $hasMore,
			]
		], 200);
	}
	
	public function getTasksByDueDate(WP_REST_Request $request)
	{
		global $wpdb;

		$projectId = (int) $request->get_param('project_id');
		$dateType = $request->get_param('date_type');
		$limit = (int) $request->get_param('limit') ?: 10;
		$offset = (int) $request->get_param('offset') ?: 0;

		$requestData = [
			'date_type' => $dateType,
			'limit' => $limit,
			'offset' => $offset
		];

		$taskController = new Lazytask_TaskController();
		$tasks = $taskController->getPaginatedTasks($projectId, $requestData, 'duedate');

		// Return only tasks from this section
		$sectionTasks = $tasks['dueDateData'][$dateType] ?? [];
		$childTasks = $tasks['childData'] ?? [];
		$hasMore = $tasks['hasMore'];

		return new WP_REST_Response([
			'status' => 200,
			'message' => 'Tasks loaded',
			'data' => [
				'dateType' => $dateType,
				'tasks' => $sectionTasks,
				'childTasks' => $childTasks,
				'hasMore' => $hasMore,
			]
		], 200);
	}

	public function updateProjectNavSettings(WP_REST_Request $request)
	{
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		$projectId = $request->get_param('id');

		$requestData = $request->get_json_params();
		
		if (!is_array($requestData) || empty($requestData)) {
			return new WP_REST_Response(['status' => 400, 'message' => 'Invalid request data', 'data' => null], 400);
		}

		$navBarSettings = isset($requestData['settings']) ? $requestData['settings'] : null;
		
		if (!$projectId) {
			return new WP_REST_Response(['status' => 404, 'message' => 'Project ID is required', 'data' => null], 404);
		}

		$project = $this->getProjectById($projectId);
		if (!$project) {
			return new WP_REST_Response(['status' => 404, 'message' => 'Project not found', 'data' => null], 404);
		}

		$settings = [];
		if (!empty($project['settings'])) {
			$settings = json_decode($project['settings'], true);
		}

		$settings['navbar'] = $navBarSettings;

		$updated = $db->update(
			LAZYTASK_TABLE_PREFIX . 'projects',
			[
				'settings' => json_encode($settings),
				'updated_at' => current_time('mysql'),
			],
			['id' => $projectId]
		);

		if ($updated !== false) {
			return new WP_REST_Response(['status' => 200, 'message' => 'Project navbar settings updated successfully', 'data' => $settings], 200);
		}

		return new WP_REST_Response(['status' => 500, 'message' => 'Failed to update project settings', 'data' => null], 500);
	}


}