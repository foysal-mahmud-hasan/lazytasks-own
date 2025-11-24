<?php

namespace Lazytask\Controller;

use Lazytask\Helper\Lazytask_DatabaseTableSchema;
use Lazytask\Helper\Lazytask_SlugGenerator;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

final class Lazytask_CompanyController {

	const TABLE_COMPANIES = LAZYTASK_TABLE_PREFIX . 'companies';
	const TABLE_COMPANY_MEMBERS = LAZYTASK_TABLE_PREFIX . 'companies_users';

	public function index(WP_REST_Request $request){

		global $wpdb;

		// get request header
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
		$permissions = isset( $decodedToken['data']['llc_permissions'] ) ? $decodedToken['data']['llc_permissions'] : [];
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';

		
		$results = [];
		if ( array_intersect( ['manage-workspace-projects'], $permissions ) ){
			$results = $db->get_results($db->prepare("SELECT * FROM `{$companyTable}` WHERE status = %d and deleted_at IS NULL",1), ARRAY_A);
		}else{
			$userController = new Lazytask_UserController();
			if(isset($decodedToken['data']['user_id'])){
				$results = $userController->getCompaniesByUserId($decodedToken['data']['user_id']);
			}
		}


		if (count($results) > 0) {
			$companyProjects = [];
			$companiesId     = array_column( $results, 'id' );

			if ( array_intersect( ['manage-workspace-projects'], $permissions ) ) {
				$companyProjects = $this->companyProjects( $companiesId );
			}else{
				$projectController = new Lazytask_ProjectController();
				$companyProjects = $projectController->getProjectsByUserIdAndCompanyId( $decodedToken['data']['user_id'], $companiesId );

			}
			$companyMembers  = $this->getCompanyMembers( $companiesId );

			foreach ($results as $key => $value) {
				$results[$key]['members'] = isset($companyMembers[ $value['id'] ]) ? $companyMembers[ $value['id'] ] :[];
				$results[$key]['projects'] = isset($companyProjects[ $value['id']]) ? $companyProjects[ $value['id']] :[];
			}
			return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$results], 200);
		}
		return new WP_REST_Response(['status'=>200, 'message'=>'No record found', 'data'=>[]], 200);
	}

	public function create(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
//		$requestData = json_decode($request->get_body(), true);
//
		$requestData = $request->get_json_params();
		$submittedData = [];
		if(isset($requestData['name'])){
			$submittedData['name'] = $requestData['name']!="" ? sanitize_text_field($requestData['name']) : '';
			$newSlug = Lazytask_SlugGenerator::slug($requestData['name'], self::TABLE_COMPANIES, 'slug' );
			$submittedData['slug'] = $requestData['slug']!="" ? sanitize_text_field($requestData['slug']) : $newSlug;
		}
		if(isset($requestData['short_name'])){
			$submittedData['short_name'] = $requestData['short_name']!="" ? sanitize_text_field($requestData['short_name']) : '';
		}
		if(isset($requestData['code'])){
			$submittedData['code'] = $requestData['code']!="" ? sanitize_text_field($requestData['code']) : '';
		}
		if(isset($requestData['address'])){
			$submittedData['address'] = $requestData['address']!="" ? sanitize_textarea_field($requestData['address']) : '';
		}
		if(isset($requestData['owner_id'])){
			$submittedData['owner_id'] = $requestData['owner_id']!="" ? $requestData['owner_id'] : null;
		}
		$submittedData['created_by'] = isset($requestData['created_by']) && $requestData['created_by']!='' ? $requestData['created_by'] : null;
		$submittedData['created_at'] = current_time('mysql');
		$members = isset($requestData['members']) && sizeof($requestData['members'])> 0 ? $requestData['members'] : [];
		$companyTableName = LAZYTASK_TABLE_PREFIX . 'companies';
		$db->insert(
			$companyTableName,
			$submittedData);
		$company_id = $wpdb->insert_id;
		if($company_id && sizeof($members)>0){

			$loggedInUserId = isset($requestData['created_by']) && $requestData['created_by']!='' ? $requestData['created_by'] : null;
			$loggedInUser = get_user_by('ID', $loggedInUserId);
			$userController = new Lazytask_UserController();

			$uniqueMembers = array_unique( array_column( $members, 'id' ) );
			$companyMembersTableName = LAZYTASK_TABLE_PREFIX . 'companies_users';
			foreach ( $uniqueMembers as $member ) {
				$db->insert(
					$companyMembersTableName,
					array(
						"company_id" => $company_id,
						"user_id" => (int)$member,
						)
				);

				$memberName = $members[array_search($member, array_column($members, 'id'))]['name'];

				$roles = $userController->getRolesByUser((int)$member);

				$userHasRoles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [];
				$rolesName = sizeof($userHasRoles) > 0 ? implode(', ', array_column($userHasRoles, 'name')) : '';

				$referenceInfo = ['id'=>$company_id, 'name'=>$requestData['name'], 'type'=>'company'];
				$placeholdersArray = ['member_name' => $memberName, 'company_name'=>$requestData['name'], 'creator_name'=> $loggedInUser ? $loggedInUser->display_name:'', 'member_roles'=>$rolesName];

				do_action('lazytask_workspace_assigned_member', $referenceInfo, ['web-app', 'email', 'sms'], [$member], $placeholdersArray);

			}
		}
		if($company_id){
			$properties['attributes'] = $submittedData;
			$activityLogArg = [
				"user_id" => isset($requestData['created_by']) && $requestData['created_by']!='' ? $requestData['created_by'] : null,
				"subject_id" => $company_id,
				"subject_name" => 'company',
				"subject_type" => 'company',
				"event" => 'created',
				"properties" => wp_json_encode($properties),
				"created_at" => current_time('mysql'),
			];
			$activityLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
			$db->insert($activityLogTable, $activityLogArg);
		}
		$data = $this->getCompanyById($company_id, $request);
		if($data){
			return new WP_REST_Response([
				'status'=>200,
				'message'=>__('Workspace created successfully', 'lazytasks-project-task-management'),
				'data'=>$data
			], 200);
		}
		return new WP_REST_Response([
			'status'=>404,
			'message'=>__('Workspace not found', 'lazytasks-project-task-management'),
		],404);

	}

	public function update(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		// Sanitize and validate the input data
		$requestData = $request->get_json_params();
		$id = $request->get_param('id');

		if(!$id){
			return new WP_REST_Response([
				'status'=> 500,
				'message' => __('Workspace id is required', 'lazytasks-project-task-management'),
				'data'=>[]
			], 500);
		}
		$prevCompany = $this->getCompanyById($id);

		$prevCompanyMembers = $prevCompany['members'];
		$prevCompanyMembersId = sizeof($prevCompanyMembers) > 0 ? array_column($prevCompanyMembers, 'id'):[];

		$submittedData = [];
		$properties= [];
		if(isset($requestData['name'])){
			$submittedData['name'] = $requestData['name']!="" ? sanitize_text_field($requestData['name']) : '';

			if($prevCompany['name'] != $submittedData['name']){
				$properties['old']['name'] = $prevCompany['name'];
				$properties['attributes']['name'] = $submittedData['name'];
			}
		}
		if(isset($requestData['short_name'])){
			$submittedData['short_name'] = $requestData['short_name']!="" ? sanitize_text_field($requestData['short_name']) : '';
		}
		if(isset($requestData['code'])){
			$submittedData['code'] = $requestData['code']!="" ? sanitize_text_field($requestData['code']) : '';
		}
		if(isset($requestData['slug'])){
			$newSlug = Lazytask_SlugGenerator::slug($requestData['name'], self::TABLE_COMPANIES, 'slug' );
			$submittedData['slug'] = $requestData['slug']!="" ? sanitize_text_field($requestData['slug']) : $newSlug;
		}
		if(isset($requestData['address'])){
			$submittedData['address'] = $requestData['address']!="" ? sanitize_textarea_field($requestData['address']) : '';
		}
		if(isset($requestData['owner_id'])){
			$submittedData['owner_id'] = $requestData['owner_id']!="" ? $requestData['owner_id'] : null;
		}

		$updated_at = current_time('mysql');
		$members = isset($requestData['members']) && sizeof($requestData['members'])> 0 ? $requestData['members'] : [];

		// Update the company in the database
		if(sizeof($submittedData)>0){
			$submittedData['updated_at'] = $updated_at;

			$companyTableName = LAZYTASK_TABLE_PREFIX . 'companies';

			$db->update(
				$companyTableName,
				$submittedData,
				array( 'id' => $id )
			);
			if(sizeof($properties)>0){
				$properties['attributes']['updated_at'] = $updated_at;
				$updatedBy = isset($requestData['updated_by']) && $requestData['updated_by']!="" ? $requestData['updated_by'] : null;
				$activityLogArg = [
					"user_id" => $updatedBy,
					"subject_id" => $id,
					"subject_name" => 'company',
					"subject_type" => 'company',
					"event" => 'updated',
					"properties" => wp_json_encode($properties),
					"created_at" => $updated_at,
				];
				$activityLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
				$db->insert($activityLogTable, $activityLogArg);
			}

		}
		if(isset($requestData['members'])){
			if(sizeof($members)>0){
				$loggedInUserId = isset($requestData['updated_by']) && $requestData['updated_by']!='' ? $requestData['updated_by'] : null;
				$loggedInUser = get_user_by('ID', $loggedInUserId);
				$userController = new Lazytask_UserController();

				$companyMembersTableName = LAZYTASK_TABLE_PREFIX . 'companies_users';

				$db->delete($companyMembersTableName, array('company_id' => $id));
				// Then, insert the new members
				$uniqueMembers = array_unique( array_column( $members, 'id' ) );
				foreach ( $uniqueMembers as $member ) {
					$db->insert(
						$companyMembersTableName,
						array(
							"company_id" => $id,
							"user_id" => (int)$member,
							"created_at" => $updated_at,
							"updated_at" => $updated_at,
						)
					);
					if(!in_array($member, $prevCompanyMembersId)){

						$memberName = $members[array_search($member, array_column($members, 'id'))]['name'];


						$roles = $userController->getRolesByUser((int)$member);

						$userHasRoles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [];
						$rolesName = sizeof($userHasRoles) > 0 ? implode(', ', array_column($userHasRoles, 'name')) : '';

						$referenceInfo = ['id'=>$id, 'name'=>$prevCompany['name'], 'type'=>'company'];
						$placeholdersArray = ['member_name' => $memberName, 'company_name'=>$prevCompany['name'], 'creator_name'=> $loggedInUser ? $loggedInUser->display_name:'', 'member_roles'=>$rolesName];

						do_action('lazytask_workspace_assigned_member', $referenceInfo, ['web-app', 'email', 'sms'], [$member], $placeholdersArray);
					}
				}

				foreach ($prevCompanyMembersId as $member) {
					if(!in_array($member, $uniqueMembers)){
						$memberName = $prevCompanyMembers[array_search($member, array_column($prevCompanyMembers, 'id'))]['name'];
						$roles = $userController->getRolesByUser((int)$member);

						$userHasRoles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [];
						$rolesName = sizeof($userHasRoles) > 0 ? implode(', ', array_column($userHasRoles, 'name')) : '';

						$referenceInfo = ['id'=>$id, 'name'=>$prevCompany['name'], 'type'=>'company'];
						$placeholdersArray = ['member_name' => $memberName, 'company_name'=>$prevCompany['name'], 'creator_name'=> $loggedInUser ? $loggedInUser->display_name:'', 'member_roles'=>$rolesName];

						do_action('lazytask_workspace_removed_member', $referenceInfo, ['web-app', 'email', 'sms'], [$member], $placeholdersArray);
					}
				}
			}else{
				if($prevCompanyMembersId && sizeof($prevCompanyMembersId)===1){
					$loggedInUserId = isset($requestData['updated_by']) && $requestData['updated_by']!='' ? $requestData['updated_by'] : null;
					$loggedInUser = get_user_by('ID', $loggedInUserId);
					// If no members were provided, delete all the members of the company
					$companyMembersTableName = LAZYTASK_TABLE_PREFIX . 'companies_users';
					$db->delete($companyMembersTableName, array('company_id' => $id));
					$userController = new Lazytask_UserController();
					foreach ($prevCompanyMembersId as $member) {
						$memberName = $prevCompanyMembers[array_search($member, array_column($prevCompanyMembers, 'id'))]['name'];
						$roles = $userController->getRolesByUser((int)$member);

						$userHasRoles = isset($roles['roles']) && sizeof($roles['roles'])>0 ? array_unique($roles['roles']) : [];
						$rolesName = sizeof($userHasRoles) > 0 ? implode(', ', array_column($userHasRoles, 'name')) : '';

						$referenceInfo = ['id'=>$id, 'name'=>$prevCompany['name'], 'type'=>'company'];
						$placeholdersArray = ['member_name' => $memberName, 'company_name'=>$prevCompany['name'], 'creator_name'=> $loggedInUser ? $loggedInUser->display_name:'', 'member_roles'=>$rolesName];

						do_action('lazytask_workspace_removed_member', $referenceInfo, ['web-app', 'email', 'sms'], [$member], $placeholdersArray);
					}
				}
			}
		}

		// Return the updated company and its members
		$data = $this->getCompanyById($id, $request);
		if($data){
			return new WP_REST_Response([
				'status'=>200,
				'message' => __('Workspace updated successfully', 'lazytasks-project-task-management'),
				'data'=>$data
			], 200);
		}
		return new WP_REST_Response([
			'status'=>404,
			'message' => __('Workspace not found', 'lazytasks-project-task-management'),
			'data'=>null
		], 404);
	}

	public function show(WP_REST_Request $request){
		global $wpdb;

		// Sanitize and validate the input data
		$id = $request->get_param('id');

		if(!$id){
			return array('status'=> 500, 'message' => 'Company ID is required', 'data'=>[]);
		}
		// Return the updated company and its members
		$data = $this->getCompanyById($id, $request);

		if($data){
			return new WP_REST_Response(['status'=>200, 'message'=>'Success', 'data'=>$data], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Company not found', 'data'=>null], 404);
	}

	public function delete(WP_REST_Request $request){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		// Sanitize and validate the input data
		$id = $request->get_param('id');
		$requestData = $request->get_json_params();
		$deletedBy = isset($requestData['deleted_by']) && $requestData['deleted_by']!="" ? $requestData['deleted_by'] : null;

		$deleted_at = current_time('mysql');
		// Update the deleted_at field in the database for the company with the provided ID
		$db->query('START TRANSACTION');
		$companyTableName = LAZYTASK_TABLE_PREFIX . 'companies';
		$companyDeleted = $db->update(
			$companyTableName,
			array(
				"deleted_at" => $deleted_at,
				"deleted_by" => (int)$deletedBy,
				"status" => 0,
			),
			array( 'id' => $id )
		);
		if (!$companyDeleted) {
			// Rollback the transaction
			$db->query('ROLLBACK');
			return new WP_Error('db_update_error', 'Could not update company in the database.', array('status' => 500));
		}

		$properties['attributes'] = ['deleted_at' => $deleted_at, 'deleted_by' => $deletedBy];
		$activityLogArg = [
			"user_id" => $deletedBy,
			"subject_id" => $id,
			"subject_name" => 'company',
			"subject_type" => 'company',
			"event" => 'deleted',
			"properties" => wp_json_encode($properties),
			"created_at" => $deleted_at,
		];
		$activityLogTable = LAZYTASK_TABLE_PREFIX . 'activity_log';
		$db->insert($activityLogTable, $activityLogArg);

		$db->query('COMMIT');
		$data = $this->getCompanyById($id, $request);
		if($data){
			return new WP_REST_Response(['status'=>200, 'message'=>'Company deleted successfully', 'data'=>$data], 200);
		}
		return new WP_REST_Response(['status'=>404, 'message'=>'Company not found', 'data'=>null], 404);
	}

	public function getCompanyById($id, $request = null) {
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';
		$row = $db->get_row( $db->prepare( "SELECT * FROM `{$companyTable}` WHERE id = %d", (int)$id ), ARRAY_A );
		if ( $row && count( $row ) > 0 ) {
			$companiesId    = $row['id'];
			$companyMembers = $this->getCompanyMembers( $companiesId );

			if( $request ) {
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
				$permissions = isset( $decodedToken['data']['llc_permissions'] ) ? $decodedToken['data']['llc_permissions'] : [];

				$companyProjects=[];
				if ( in_array( 'create-workspace', $permissions ) ) {
					$companyProjects = $this->companyProjects( $id );
				}else{
					$projectController = new Lazytask_ProjectController();
					if(isset($decodedToken['data']['user_id'])){
						$companyProjects = $projectController->getProjectsByUserIdAndCompanyId( $decodedToken['data']['user_id'], [$id] );
					}
				}
				$row['projects'] = isset( $companyProjects[ $row['id'] ] ) ? $companyProjects[ $row['id'] ] : [];
			}

			$row['members'] = isset( $companyMembers[ $row['id'] ] ) ? $companyMembers[ $row['id'] ] : [];
			return $row;
		}
		return null;
	}

	public function getCompanyMembers($companiesId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$usersTable = $wpdb->prefix . 'users';
		$companyMembersTable = LAZYTASK_TABLE_PREFIX . 'companies_users';
	if (is_array($companiesId)) {
		$ids = implode(', ', array_fill(0, count($companiesId), '%s'));
	}else{
		$ids = '%s';
		$companiesId = [$companiesId];
	}

		$sql = "SELECT * FROM `{$usersTable}` as users
			JOIN `{$companyMembersTable}` as companyMembers  ON users.ID = companyMembers.user_id 
		WHERE companyMembers.company_id IN ($ids)";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $companiesId));

		$results = $db->get_results(
			$query, ARRAY_A);
		$returnArray = [];
		if($results){
			foreach ($results as $key => $value) {
				$returnArray[$value['company_id']][] = [
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

	private function companyProjects($companiesId){
		global $wpdb;
		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);
		$projectsTable = LAZYTASK_TABLE_PREFIX . 'projects';
		$companyTable = LAZYTASK_TABLE_PREFIX . 'companies';

		if (is_array($companiesId)) {
			$ids = implode(', ', array_fill(0, count($companiesId), '%s'));
		}else{
			$ids = '%s';
			$companiesId = [$companiesId];
		}

		$sql = "SELECT projects.id, projects.name, projects.slug, projects.code, projects.status, projects.company_id FROM `{$projectsTable}` as projects
			JOIN `{$companyTable}` as company  ON projects.company_id = company.id 
		WHERE projects.deleted_at IS NULL AND company.id IN ($ids)";

		$query = call_user_func_array(array($wpdb, 'prepare'), array_merge(array($sql), $companiesId));

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



}