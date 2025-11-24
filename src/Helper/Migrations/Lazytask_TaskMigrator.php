<?php

namespace Lazytask\Helper\Migrations;
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

class Lazytask_TaskMigrator {

	//migrate
	public static function migrate()
	{
		self::privacy_column_add();
		self::start_date_is_visible_column_add();
		self::end_date_is_visible_column_add();
		self::serial_no_column_add();
		self::serial_no_data_entry();
		self::tbl_project_statuses();
		self::project_status_data_entry();
		self::internal_status_id_column_add();
		self::tbl_tasks_for_gantt();
		self::all_tasks_insert_into_tasks_for_gantt_table();
		self::mention_notification_template_data_entry();
		self::update_web_app_notification_template();
		self::permission_group_column_add();
		self::new_permission_data_entry();
		self::new_permission_with_role_data_entry();
		self::channel_status_column_add();
		self::channel_status_data_entry();
		self::add_index_task_table();
		self::add_deleted_at_roles_table();
		self::duplicate_permission_entry();
		self::assign_duplicate_permissions_to_roles();
		self::whiteboard_permission_entry();
		self::assign_whiteboard_permission_to_roles();
		self::update_page_title();
		self::add_settings_column_in_projects_table();
		self::add_is_visible_on_gantt_column_add();
		self::all_gantt_tasks_insert_into_tasks_table();
		self::update_notification_template_for_mobile_channel();
		self::update_user_registration_email_notification_template();
		self::update_subtask_serial_no();
		self::new_task_actions_permission_entry();
		
	}

	private static function privacy_column_add()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';

		$column_name = 'privacy';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name VARCHAR(20) DEFAULT 'public' AFTER `status`");
		}

	}

	//start_date_is_visible and end_date_is_visible
	private static function start_date_is_visible_column_add()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';

		$column_name = 'start_date_is_visible';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name TINYINT(1) DEFAULT 0 AFTER `start_date`");
		}

	}

	private static function end_date_is_visible_column_add()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';

		$column_name = 'end_date_is_visible';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name TINYINT(1) DEFAULT 1 AFTER `end_date`");
		}

	}
	
	// Function for add serial_no column in tasks table
	private static function serial_no_column_add()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';

		$column_name = 'serial_no';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name INT DEFAULT NULL AFTER `deleted_by`");
		}

	}

	// Function for serial entry initially
	private static function serial_no_data_entry()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';

		// First check if there are any rows with non-null serial_no
		$has_serial = $wpdb->get_var("
			SELECT COUNT(*) 
			FROM {$table_name} 
			WHERE serial_no IS NOT NULL
		");

		// If any row has serial_no, return early
		if ($has_serial > 0) {
			return;
		}

		// Get all tasks with null serial_no ordered by ID
		$tasks = $wpdb->get_results(
			"SELECT id FROM {$table_name} 
			WHERE serial_no IS NULL AND deleted_at IS NULL
			ORDER BY id ASC"
		);
	
		if (!empty($tasks)) {
			$sql = "UPDATE $table_name
				SET serial_no = id";

			$wpdb->query($sql);
		}
	}

	private static function tbl_project_statuses(){
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'project_statuses';

		$table_generate_query = "
	        CREATE TABLE IF NOT EXISTS `". $table_name ."` (
		`id` bigint unsigned NOT NULL AUTO_INCREMENT,
		`project_id` bigint unsigned DEFAULT NULL,
		`created_by` bigint unsigned DEFAULT NULL,
		`updated_by` bigint unsigned DEFAULT NULL,
		`name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
		`slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
		`color_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
		`sort_order` int NOT NULL DEFAULT '1',
		`is_active` TINYINT(1) NOT NULL DEFAULT '1',
		`created_at` timestamp NULL DEFAULT NULL,
		`updated_at` timestamp NULL DEFAULT NULL,
		`deleted_at` timestamp NULL DEFAULT NULL,
		PRIMARY KEY (`id`)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		";
		require_once (ABSPATH. 'wp-admin/includes/upgrade.php');
		dbDelta($table_generate_query);
	}

	private static function project_status_data_entry()
	{
		global $wpdb;
		$project_status_table = LAZYTASK_TABLE_PREFIX . 'project_statuses';
		$projects_table = LAZYTASK_TABLE_PREFIX . 'projects';

		// Fetch all project IDs
		$project_ids = $wpdb->get_col("SELECT id FROM $projects_table");
		if (empty($project_ids)) return;

		$created_at = current_time('mysql');
		$created_by = get_current_user_id();
		$updated_at = current_time('mysql');
		$defaultStatuses = ['Active', 'In Progress', 'Complete'];
		$defaultColors = ['#2D9CDB', '#F2C94C', '#27AE60'];

		// Fetch existing statuses for all projects
		$existing_statuses = $wpdb->get_results(
			"SELECT project_id, name FROM $project_status_table WHERE project_id IN (" . implode(',', $project_ids) . ")",
			ARRAY_A
		);

		// Create a lookup array for existing statuses
		$existing_statuses_lookup = [];
		foreach ($existing_statuses as $status) {
			$existing_statuses_lookup[$status['project_id']][$status['name']] = true;
		}

		// Prepare data for batch insert
		$insert_data = [];
		foreach ($project_ids as $project_id) {
			foreach ($defaultStatuses as $key => $value) {
				if (empty($existing_statuses_lookup[$project_id][$value])) {
					$insert_data[] = $wpdb->prepare(
						"(%d, %d, %s, %s, %s, %d, %d, %s, %s)",
						$project_id,
						$created_by,
						$value,
						strtolower(str_replace(' ', '-', $value)),
						$defaultColors[$key],
						$key + 1,
						1,
						$created_at,
						$updated_at
					);
				}
			}
		}

		// Perform batch insert if there is data to insert
		if (!empty($insert_data)) {
			$query = "INSERT INTO $project_status_table 
				(project_id, created_by, name, slug, color_code, sort_order, is_active, created_at, updated_at) 
				VALUES " . implode(',', $insert_data);
			$wpdb->query($query);
		}
	}

	// Function for add internal_status_id column in tasks table
	private static function internal_status_id_column_add()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';

		$column_name = 'internal_status_id';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name INT DEFAULT NULL AFTER `priority_id`");
		}

	}

	private static function tbl_tasks_for_gantt() {
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks_for_gantt';

		$table_generate_query = "
	        CREATE TABLE IF NOT EXISTS `". $table_name ."` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned DEFAULT NULL,
  `task_id` bigint unsigned DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `is_visible` int NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";
		require_once (ABSPATH. 'wp-admin/includes/upgrade.php');
		dbDelta($table_generate_query);
	}

	//all tasks insert into tasks_for_gantt table with relationship task_id
	private static function all_tasks_insert_into_tasks_for_gantt_table()
	{
		global $wpdb;
		$tasks_table = LAZYTASK_TABLE_PREFIX . 'tasks';
		$tasks_for_gantt_table = LAZYTASK_TABLE_PREFIX . 'tasks_for_gantt';

		// Check if the tasks_for_gantt table is empty
		$is_empty = $wpdb->get_var("SELECT COUNT(*) FROM $tasks_for_gantt_table") == 0;

		if ($is_empty) {
			// Insert all tasks into tasks_for_gantt table
			$wpdb->query("INSERT INTO $tasks_for_gantt_table (task_id, project_id, status, sort_order, created_at, updated_at) 
				SELECT id, project_id, status, sort_order, created_at, updated_at FROM $tasks_table");
		}

	}

	private static function mention_notification_template_data_entry()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'notification_templates';

		$template = [
        'title' => 'When someone mentions you in a task',
        'notification_action_name' => 'lazytask_task_member_mention',
        'description' => 'Notification when someone mentions you in a task',
        'email_subject' => '[CREATOR_NAME] mentioned you in a task - LazyTask',
        'content' => json_encode([
            'email' => "Hello [MEMBER_NAME],

[CREATOR_NAME] mentioned you in the task '[TASK_NAME]'.

If you think this was an error, please contact your Manager.

Thanks,
System Notification",
        'web-app' => 'You have been mentioned in the task [TASK_NAME] by [CREATOR_NAME].',
		'mobile' => 'You have been mentioned in the task [TASK_NAME] by [CREATOR_NAME].'
        ]),
        'type' => null,
        'status' => 1,
        'sort_order' => 1,
        'updated_at' => gmdate('Y-m-d H:i:s')
    ];
		$checkMentionNotificationTemplate = $wpdb->get_row($wpdb->prepare("SELECT * FROM `{$table_name}` WHERE notification_action_name = %s", $template['notification_action_name'] ) );
		if(!$checkMentionNotificationTemplate) {
			$template['created_at'] = gmdate('Y-m-d H:i:s');
			$wpdb->insert($table_name, $template);
		}else{
			$wpdb->update(
				$table_name,
				$template,
				['notification_action_name' => $template['notification_action_name']]
			);
		}
	}

	private static function update_web_app_notification_template()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'notification_templates';

		$current_time = gmdate('Y-m-d H:i:s');

		$templates = [
			'lazytask_project_assigned_member' => [
				'content' => json_encode([
'email' => 'Hello [MEMBER_NAME],

You have been added to the project [PROJECT_NAME] by [CREATOR_NAME] in the role of [MEMBER_ROLES].

If you think this was an error, please contact your Manager.

Thanks.
System Notification',
'web-app' => 'You have been added to the project "[PROJECT_NAME]" by [CREATOR_NAME] in the role of [MEMBER_ROLES]',
'mobile' => 'You have been added to the project "[PROJECT_NAME]" by [CREATOR_NAME] in the role of [MEMBER_ROLES]'
			]),
				'updated_at' => $current_time
			],
			'lazytask_project_removed_member' => [
				'content' => json_encode([
'email' => 'Hello [MEMBER_NAME],

You have been removed from the project [PROJECT_NAME] by [CREATOR_NAME] in the role of [MEMBER_ROLES].

If you think this was an error, please contact your Manager.

Thanks.
System Notification',
'web-app' => 'You have been removed from the project "[PROJECT_NAME]" by [CREATOR_NAME]',
'mobile' => 'You have been removed from the project "[PROJECT_NAME]" by [CREATOR_NAME]'
			]),
				'updated_at' => $current_time
			],
			'lazytask_task_assigned_member' => [
				'content' => json_encode([
'email' => 'Hello [MEMBER_NAME],

The following task has been assigned to you by [CREATOR_NAME] on the [PROJECT_NAME].

Task Name: [TASK_NAME]

Please sign into your project management web-portal or mobile app for further details.

Thanks.
System Notification',
'web-app' => 'The task "[TASK_NAME]" has been assigned to you by [CREATOR_NAME] on the project "[PROJECT_NAME]"',
'mobile' => 'The task "[TASK_NAME]" has been assigned to you by [CREATOR_NAME] on the project "[PROJECT_NAME]"'
			]),
				'updated_at' => $current_time
			],
			'lazytask_task_deadline_changed' => [
				'content' => json_encode([
'email' => 'Hello [MEMBER_NAME],

The deadline for [TASK_NAME] in the [PROJECT_NAME] has been changed from [PREVIOUS_ASSIGNED_DATE] to [NEW_ASSIGNED_DATE] by [CREATOR_NAME].

Please sign into view further details.

Thanks.
System Notification',
'web-app' => '"[TASK_NAME]" is [PROJECT_NAME] project has been changed from [PREVIOUS_ASSIGNED_DATE] to [NEW_ASSIGNED_DATE] by [CREATOR_NAME].',
'mobile' => '"[TASK_NAME]" is [PROJECT_NAME] project has been changed from [PREVIOUS_ASSIGNED_DATE] to [NEW_ASSIGNED_DATE] by [CREATOR_NAME].'
			]),
				'updated_at' => $current_time
			],
			'lazytask_task_follow_by_own' => [
				'content' => json_encode([
'email' => 'Hello [MEMBER_NAME],

[CREATOR_NAME] is now following the task titled [TASK_NAME].

Please sign into your project management web-portal or mobile app for further details.

Thanks.
System Notification',
'web-app' => '[CREATOR_NAME] is now following the task "[TASK_NAME]"',
'mobile' => '[CREATOR_NAME] is now following the task "[TASK_NAME]"'
			]),
				'updated_at' => $current_time
			],
			'lazytask_task_follow_to_other' => [
				'content' => json_encode([
				'email' => 'Hello [MEMBER_NAME],

[CREATOR_NAME] has now made you a follower of the task [TASK_NAME].

Usually, when someone makes you a follower of a task, that means you need to keep an eye on this specific task.

Please sign into your project management web-portal or mobile app for further details.

Thanks.
System Notification',
'web-app' => '[CREATOR_NAME] has now made you a follower of the task "[TASK_NAME]"',
'mobile' => '[CREATOR_NAME] has now made you a follower of the task "[TASK_NAME]"'
				]),
				'updated_at' => $current_time
			],
		];

		// update queries for each template
		foreach ($templates as $action => $data) {
			$existing_template = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT content FROM {$table_name} WHERE notification_action_name = %s",
					$action
				),
				ARRAY_A
			);
			if($existing_template){
				if ($existing_template['content'] !== $data['content']) {
					$wpdb->update(
						$table_name,
						$data,
						['notification_action_name' => $action]
					);
				}
			}
		}
	}

	// Function for add serial_no column in tasks table
	private static function permission_group_column_add()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'permissions';

		$column_name = 'permission_group';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name VARCHAR(50) DEFAULT NULL AFTER `description`");
		}

	}

	private static function new_permission_data_entry()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'permissions';

		$arrayPermissions = [
			[
				'name' => 'view-only-access',
				'description' => 'View Only Access',
				'permission_group' => 'Other'
			],[
				'name' => 'create-workspace',
				'description' => 'Create Workspace',
				'permission_group' => 'Workspace'
			],[
				'name' => 'edit-workspace',
				'description' => 'Edit Workspace',
				'permission_group' => 'Workspace'
			],[
				'name' => 'delete-workspace',
				'description' => 'Delete Workspace',
				'permission_group' => 'Workspace'
			],[
				'name' => 'create-project',
				'description' => 'Create Project',
				'permission_group' => 'Projects'
			],[
				'name' => 'edit-project',
				'description' => 'Edit Project',
				'permission_group' => 'Projects'
			],[
				'name' => 'delete-project',
				'description' => 'Delete Project',
				'permission_group' => 'Projects'
			],[
				'name' => 'add-member-to-project-send-invite',
				'description' => 'Add member to project+send invite',
				'permission_group' => 'Projects'
			],[
				'name' => 'remove-member-from-project',
				'description' => 'Remove member from project',
				'permission_group' => 'Projects'
			],[
				'name' => 'add-remove-status',
				'description' => 'Add/Remove Status',
				'permission_group' => 'Projects'
			],[
				'name' => 'add-remove-priority',
				'description' => 'Add/Remove Priority',
				'permission_group' => 'Projects'
			],[
				'name' => 'create-manage-section',
				'description' => 'Create & Manage Section',
				'permission_group' => 'Section'
			],[
				'name' => 'archive-section',
				'description' => 'Archive Section',
				'permission_group' => 'Section'
			],[
				'name' => 'archive-all-tasks',
				'description' => 'Archive All Tasks Inside Section',
				'permission_group' => 'Section'
			],[
				'name' => 'mark-as-complete',
				'description' => 'Mark As Complete',
				'permission_group' => 'Section'
			],[
				'name' => 'create-task',
				'description' => 'Create Task',
				'permission_group' => 'Tasks'
			],[
				'name' => 'edit-task',
				'description' => 'Edit Any Task',
				'permission_group' => 'Tasks'
			],[
				'name' => 'delete-task',
				'description' => 'Delete Any Task',
				'permission_group' => 'Tasks'
			],[
				'name' => 'archive-task',
				'description' => 'Archive Task',
				'permission_group' => 'Tasks'
			],[
				'name' => 'assign-task-to-member',
				'description' => 'Assign Member',
				'permission_group' => 'Tasks'
			],[
				'name' => 'assign-follower',
				'description' => 'Assign & Remove Followers',
				'permission_group' => 'Tasks'
			],[
				'name' => 'add-attachments',
				'description' => 'Add Attachments',
				'permission_group' => 'Tasks'
			],[
				'name' => 'delete-attachments',
				'description' => 'Delete Attachments',
				'permission_group' => 'Tasks'
			],[
				'name' => 'change-priority',
				'description' => 'Change Priority',
				'permission_group' => 'Tasks'
			],[
				'name' => 'change-status',
				'description' => 'Change Status',
				'permission_group' => 'Tasks'
			],[
				'name' => 'change-duedate',
				'description' => 'Assign & Remove Due Date',
				'permission_group' => 'Tasks'
			],[
				'name' => 'add-subtask',
				'description' => 'Add Subtask',
				'permission_group' => 'Tasks'
			],[
				'name' => 'delete-subtask',
				'description' => 'Delete Any Subtask',
				'permission_group' => 'Tasks'
			],[
				'name' => 'add-comments',
				'description' => 'Add Comments',
				'permission_group' => 'Tasks'
			],[
				'name' => 'delete-comments',
				'description' => 'Delete Any Comments',
				'permission_group' => 'Tasks'
			],[
				'name' => 'general-settings',
				'description' => 'General Settings',
				'permission_group' => 'Setting'
			],[
				'name' => 'manage-tags',
				'description' => 'Manage Tags',
				'permission_group' => 'Setting'
			],[
				'name' => 'manage-rolls-permissions',
				'description' => 'Manage Roles & Permissions',
				'permission_group' => 'Setting'
			],[
				'name' => 'manage-users',
				'description' => 'Manage Users',
				'permission_group' => 'Setting'
			],[
				'name' => 'manage-workspace-projects',
				'description' => 'View Workspace & Projects',
				'permission_group' => 'Setting'
			],[
				'name' => 'manage-notifications',
				'description' => 'Manage Notifications',
				'permission_group' => 'Setting'
			]
			
		];

		
		if((int)$wpdb->get_var("SELECT COUNT(*) FROM $table_name") <= 10){
			$wpdb->query("TRUNCATE TABLE {$table_name}");
			foreach ($arrayPermissions as $item){
				$wpdb->insert($table_name, $item);
			}
		}

	}

	private static function new_permission_with_role_data_entry()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'role_has_permissions';
		$roleTable        = LAZYTASK_TABLE_PREFIX . 'roles';
		$permissionTable  = LAZYTASK_TABLE_PREFIX . 'permissions';

		$roles = [];
		$roleResults = $wpdb->get_results("SELECT id, name FROM {$roleTable}");
		foreach ($roleResults as $role) {
			$roles[$role->name] = $role;
		}

		$permissions = [];
		$permissionResults = $wpdb->get_results("SELECT id, name FROM {$permissionTable}");
		foreach ($permissionResults as $perm) {
			$permissions[$perm->name] = $perm;
		}

		$rolePermissionMappings = [
			'Superadmin' => array_keys($permissions), // All permission names

			'Admin' => [
				'view-only-access', 'create-project', 'edit-project', 'delete-project', 'add-member-to-project-send-invite', 'remove-member-from-project', 'add-remove-status', 'add-remove-priority',
				'create-manage-section', 'archive-section', 'archive-all-tasks', 'mark-as-complete',
				'create-task', 'edit-task', 'delete-task', 'archive-task', 'assign-task-to-member', 'assign-follower',
				'add-attachments', 'delete-attachments', 'change-priority', 'change-status', 'change-duedate', 'add-subtask', 'delete-subtask',
				'add-comments', 'delete-comments', 'general-settings', 'manage-tags',
				'manage-users', 'manage-workspace-projects'
			],

			'Director' => [
				'view-only-access', 'add-member-to-project-send-invite', 'remove-member-from-project', 'add-remove-status', 'add-remove-priority',
				'create-manage-section', 'archive-section', 'archive-all-tasks', 'mark-as-complete',
				'create-task', 'edit-task', 'delete-task', 'archive-task', 'assign-task-to-member', 'assign-follower',
				'add-attachments', 'delete-attachments', 'change-priority', 'change-status', 'change-duedate', 'add-subtask', 'delete-subtask',
				'add-comments',  'delete-comments', 'manage-tags',
				'manage-users', 'manage-workspace-projects'
			],

			'Manager' => [
				'view-only-access', 'add-member-to-project-send-invite', 'remove-member-from-project', 'add-remove-status', 'add-remove-priority',
				'create-manage-section', 'archive-section', 'archive-all-tasks', 'mark-as-complete',
				'create-task', 'edit-task', 'delete-task', 'archive-task', 'assign-task-to-member', 'assign-follower',
				'add-attachments', 'delete-attachments', 'change-priority', 'change-status', 'change-duedate', 'add-subtask', 'delete-subtask',
				'add-comments',  'delete-comments'
			],

			'Line Manager' => [
				'view-only-access', 'create-manage-section', 'archive-section', 'archive-all-tasks', 'mark-as-complete',
				'create-task', 'edit-task', 'delete-task', 'archive-task', 'assign-task-to-member', 'assign-follower',
				'add-attachments', 'delete-attachments', 'change-priority', 'change-status', 'change-duedate', 'add-subtask', 'delete-subtask',
				'add-comments', 'delete-comments'
			],

			'Employee' => [
				'view-only-access', 'create-task', 'edit-task', 'delete-task', 'archive-task', 'assign-task-to-member', 'assign-follower',
				'add-attachments', 'delete-attachments', 'change-priority', 'change-status', 'change-duedate', 'add-subtask', 'delete-subtask',
				'add-comments', 'delete-comments'
			],

			'Follower' => [
				'view-only-access'
			]
		];
		
		if((int)$wpdb->get_var("SELECT COUNT(*) FROM $table_name") <= 49) {
			$wpdb->query("TRUNCATE TABLE {$table_name}");
			foreach ($rolePermissionMappings as $roleName => $permNames) {
				if (!isset($roles[$roleName])) {
					error_log("Role not found: " . $roleName);
					continue;
				}

				$roleId = $roles[$roleName]->id;

				foreach ($permNames as $permName) {
					if (!isset($permissions[$permName])) {
						error_log("Permission not found: " . $permName);
						continue;
					}

					$permissionId = $permissions[$permName]->id;

					$wpdb->insert($table_name, [
						'role_id'       => $roleId,
						'permission_id' => $permissionId
					]);
				}
			}
		}

	}

	// Function for add channel status in notification template table
	private static function channel_status_column_add()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'notification_templates';

		$column_name = 'channel_status';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name MEDIUMTEXT DEFAULT NULL AFTER `email_subject`");
		}
	}

	// Function for channel_status entry initially
	private static function channel_status_data_entry()
	{
		global $wpdb;
		$template_table = LAZYTASK_TABLE_PREFIX . 'notification_templates';
		$channels_table = LAZYTASK_TABLE_PREFIX . 'notification_channels';

		// Get all channel names
		$channels = $wpdb->get_col("SELECT slug FROM $channels_table");
		if (empty($channels)) return;

		// Get all templates
		$templates = $wpdb->get_results("SELECT id, content FROM $template_table");

		foreach ($templates as $template) {
			$content = json_decode($template->content, true);
			if (!is_array($content)) continue;

			$status = [];
			foreach ($channels as $channel) {
				$status[$channel] = array_key_exists($channel, $content);
			}

			$wpdb->update(
				$template_table,
				['channel_status' => json_encode($status)],
				['id' => $template->id]
			);
		}
	}
	
	// Function for add index on task table
	private static function add_index_task_table()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';
		
		$indexes = [
			'project_id_idx'        => 'project_id',
			'serial_no_idx'         => 'serial_no',
			'status_idx'            => 'status',
			'assigned_to_idx'       => 'assigned_to',
			'priority_id_idx'       => 'priority_id',
			'internal_status_id_idx'=> 'internal_status_id',
			'section_id_idx'        => 'section_id',
			'parent_id_idx'         => 'parent_id',
			'deleted_at_idx'        => 'deleted_at',
		];

		foreach ($indexes as $index_name => $column) {
			$index_exists = $wpdb->get_var("SHOW INDEX FROM $table_name WHERE Key_name = '$index_name'");
			if (!$index_exists) {
				$wpdb->query("ALTER TABLE $table_name ADD INDEX $index_name ($column)");
			}
		}
		
	}

	private static function add_deleted_at_roles_table()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'roles';

		$column_name = 'deleted_at';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name DATETIME NULL AFTER `updated_at`");
		}
	}

	private static function duplicate_permission_entry()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'permissions';

		$permissions = [
			[
				'name' => 'duplicate-task',
				'description' => 'Duplicate Task',
				'permission_group' => 'Tasks'
			],
			[
				'name' => 'duplicate-section',
				'description' => 'Duplicate Section',
				'permission_group' => 'Section'
			],
			[
				'name' => 'license-tab',
				'description' => 'Access License Tab',
				'permission_group' => 'Setting'
			]
		];

		foreach ($permissions as $permission) {
			$exists = $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $table_name WHERE name = %s",
				$permission['name']
			));

			if (!$exists) {
				$wpdb->insert($table_name, $permission);
			}
		}
	}

	private static function assign_duplicate_permissions_to_roles()
	{
		global $wpdb;

		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';
		$permissionsTable = LAZYTASK_TABLE_PREFIX . 'permissions';
		$roleHasPermissionTable = LAZYTASK_TABLE_PREFIX . 'role_has_permissions';

		// Roles for duplicate permissions
		$duplicatePermissionRoles = ['superadmin', 'admin', 'director', 'manager'];
		$duplicatePermissions = ['duplicate-task', 'duplicate-section'];

		// Permission for license-tab
		$licensePermissionSlug = 'license-tab';
		$licenseRole = 'superadmin';

		// Fetch permission IDs
		$permissions = [];

		foreach (array_merge($duplicatePermissions, [$licensePermissionSlug]) as $slug) {
			$permission_id = $wpdb->get_var($wpdb->prepare(
				"SELECT id FROM $permissionsTable WHERE name = %s",
				$slug
			));
			if ($permission_id) {
				$permissions[$slug] = $permission_id;
			}
		}

		// Assign duplicate-task and duplicate-section to multiple roles
		foreach ($duplicatePermissionRoles as $roleSlug) {
			$role_id = $wpdb->get_var($wpdb->prepare(
				"SELECT id FROM $rolesTable WHERE slug = %s",
				$roleSlug
			));

			if (!$role_id) {
				continue;
			}

			foreach ($duplicatePermissions as $slug) {
				if (!isset($permissions[$slug])) continue;

				$exists = $wpdb->get_var($wpdb->prepare(
					"SELECT COUNT(*) FROM $roleHasPermissionTable WHERE role_id = %d AND permission_id = %d",
					$role_id, $permissions[$slug]
				));

				if (!$exists) {
					$wpdb->insert($roleHasPermissionTable, [
						'role_id' => $role_id,
						'permission_id' => $permissions[$slug],
					]);
				}
			}
		}

		// Assign license-tab only to superadmin
		$superadmin_id = $wpdb->get_var($wpdb->prepare(
			"SELECT id FROM $rolesTable WHERE slug = %s",
			$licenseRole
		));

		if ($superadmin_id && isset($permissions[$licensePermissionSlug])) {
			$exists = $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $roleHasPermissionTable WHERE role_id = %d AND permission_id = %d",
				$superadmin_id, $permissions[$licensePermissionSlug]
			));

			if (!$exists) {
				$wpdb->insert($roleHasPermissionTable, [
					'role_id' => $superadmin_id,
					'permission_id' => $permissions[$licensePermissionSlug],
				]);
			}
		}
	}

	private static function whiteboard_permission_entry()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'permissions';

		$permissions = [
			[
				'name' => 'feedback-support',
				'description' => 'Feedback, Support & Connect with Founder',
				'permission_group' => 'Setting'
			],
			[
				'name' => 'addon-install',
				'description' => 'Addon Install',
				'permission_group' => 'Setting'
			],
			[
				'name' => 'whiteboard-access',
				'description' => 'Whiteboard Access',
				'permission_group' => 'Whiteboard'
			],
			[
				'name' => 'whiteboard-manage',
				'description' => 'Manage Whiteboard',
				'permission_group' => 'Whiteboard'
			],
			[
				'name' => 'whiteboard-comments',
				'description' => 'Whiteboard Comments',
				'permission_group' => 'Whiteboard'
			]
		];

		foreach ($permissions as $permission) {
			$exists = $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $table_name WHERE name = %s",
				$permission['name']
			));

			if (!$exists) {
				$wpdb->insert($table_name, $permission);
			}
		}
	}

	private static function assign_whiteboard_permission_to_roles()
	{
		global $wpdb;

		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';
		$permissionsTable = LAZYTASK_TABLE_PREFIX . 'permissions';
		$roleHasPermissionTable = LAZYTASK_TABLE_PREFIX . 'role_has_permissions';

		// Roles for whiteboard permissions
		$whiteboardPermissionRoles = ['superadmin', 'admin', 'director', 'manager'];
		$whiteboardPermissions = ['whiteboard-access', 'whiteboard-manage', 'whiteboard-comments'];

		// Permission for addon-install & feedback-support
		$addonPermissionSlug = ['feedback-support','addon-install'];
		$addonRole = 'superadmin';

		// Fetch permission IDs
		$permissions = [];

		foreach (array_merge($whiteboardPermissions, $addonPermissionSlug) as $slug) {
			$permission_id = $wpdb->get_var($wpdb->prepare(
				"SELECT id FROM $permissionsTable WHERE name = %s",
				$slug
			));
			if ($permission_id) {
				$permissions[$slug] = $permission_id;
			}
		}

		// Assign duplicate-task and duplicate-section to multiple roles
		foreach ($whiteboardPermissionRoles as $roleSlug) {
			$role_id = $wpdb->get_var($wpdb->prepare(
				"SELECT id FROM $rolesTable WHERE slug = %s",
				$roleSlug
			));

			if (!$role_id) {
				continue;
			}

			foreach ($whiteboardPermissions as $slug) {
				if (!isset($permissions[$slug])) continue;

				$exists = $wpdb->get_var($wpdb->prepare(
					"SELECT COUNT(*) FROM $roleHasPermissionTable WHERE role_id = %d AND permission_id = %d",
					$role_id, $permissions[$slug]
				));

				if (!$exists) {
					$wpdb->insert($roleHasPermissionTable, [
						'role_id' => $role_id,
						'permission_id' => $permissions[$slug],
					]);
				}
			}
		}

		// Assign license-tab only to superadmin
		$superadmin_id = $wpdb->get_var($wpdb->prepare(
			"SELECT id FROM $rolesTable WHERE slug = %s",
			$addonRole
		));

		if ($superadmin_id) {
			foreach ($addonPermissionSlug as $slug) {
				if (!isset($permissions[$slug])) continue;

				$exists = $wpdb->get_var($wpdb->prepare(
					"SELECT COUNT(*) FROM $roleHasPermissionTable WHERE role_id = %d AND permission_id = %d",
					$superadmin_id, $permissions[$slug]
				));

				if (!$exists) {
					$wpdb->insert($roleHasPermissionTable, [
						'role_id' => $superadmin_id,
						'permission_id' => $permissions[$slug],
					]);
				}
			}
		}
	}

	private static function update_page_title()
	{
		$lazytask_page_id = get_option('lazytask_page_id');

		if (!$lazytask_page_id) {
			return; 
		}

		$post = get_post($lazytask_page_id);
		if (!$post) {
			return;
		}

		if ($post->post_title === 'LazyTasks') {
			return;
		}

		// post title update
		$post_data = array(
			'ID' => $lazytask_page_id,
			'post_title' => 'LazyTasks'
		);
		
		// Update post title
		$updated_post = wp_update_post($post_data, true);
	}

	private static function add_settings_column_in_projects_table()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'projects';

		$column_name = 'settings';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name LONGTEXT DEFAULT NULL AFTER `address`");
			
			$projects = $wpdb->get_results("SELECT id, settings FROM $table_name");
			foreach ($projects as $project) {
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
	
				if (!$project->settings) {
					$wpdb->update(
						$table_name,
						['settings' => json_encode($default_settings)],
						['id' => $project->id]
					);
				}
			}
		}

	}

	private static function add_is_visible_on_gantt_column_add()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'tasks';

		$column_name = 'is_visible_on_gantt';

		if($wpdb->get_var("SHOW COLUMNS FROM $table_name LIKE '$column_name'") != $column_name) {
			$wpdb->query("ALTER TABLE $table_name ADD $column_name VARCHAR(20) DEFAULT '0' AFTER `privacy`");
		}
	}

	private static function all_gantt_tasks_insert_into_tasks_table()
	{
		global $wpdb;
		$tasks_table = LAZYTASK_TABLE_PREFIX . 'tasks';
		$tasks_for_gantt_table = LAZYTASK_TABLE_PREFIX . 'tasks_for_gantt';

		$table_exists = $wpdb->get_var($wpdb->prepare(
			"SHOW TABLES LIKE %s",
			$tasks_for_gantt_table
		));

		if ($table_exists !== $tasks_for_gantt_table) {
			// Table doesn't exist — safely return
			error_log("Table {$tasks_for_gantt_table} does not exist, skipping gantt sync.");
			return;
		}

		// Check if the tasks_for_gantt table is empty
		$gantt_tasks = $wpdb->get_results("SELECT task_id FROM $tasks_for_gantt_table WHERE is_visible = 1 AND deleted_at IS NULL AND status = 'ACTIVE'");

		if (!empty($gantt_tasks)) {
			$task_ids = wp_list_pluck($gantt_tasks, 'task_id');
			$task_ids_placeholders = implode(',', array_fill(0, count($task_ids), '%d'));

			// Update tasks table to set is_visible_on_gantt to '1' for matching task IDs
			$query = $wpdb->prepare(
				"UPDATE $tasks_table SET is_visible_on_gantt = '1' WHERE id IN ($task_ids_placeholders)",
				$task_ids
			);
			$wpdb->query($query);
		}

		if ($table_exists === $tasks_for_gantt_table) {
			$wpdb->query("DROP TABLE IF EXISTS `$tasks_for_gantt_table`");
		}

	}

	private static function update_notification_template_for_mobile_channel()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'notification_templates';

		$current_time = gmdate('Y-m-d H:i:s');

		// Check if update was already done
		$already_updated = get_option('lazytask_mobile_channel_update_done');
		if ($already_updated) {
			return;
		}

		$channels = [
			"web-app" => true,
			"sms" => false,
			"email" => true,
			"mobile" => false,
			"browser" => false
		];

		$channel_json = json_encode($channels);

		$all_updated = true;

		$channel_update = $wpdb->query(
			$wpdb->prepare(
				"UPDATE $table_name
				SET channel_status = %s, updated_at = %s
				WHERE notification_action_name NOT IN ('lazytask_project_assigned_member', 'lazytask_task_assigned_member')",
				$channel_json,
				$current_time
			)
		);


		if($channel_update === false){
			$all_updated = false;
			error_log("Notification templates not updated successfully for mobile channel.");
		}

		$project_assigned_template = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id, content, mobile_notification_title FROM {$table_name} WHERE notification_action_name = %s",
				'lazytask_project_assigned_member'
			),
			ARRAY_A
		);

		if ($project_assigned_template) {
			// Decode the content JSON
			$project_assigned_content = json_decode($project_assigned_template['content'], true);

			// Update the mobile value
			$project_assigned_content['mobile'] = '[PROJECT_NAME] as [MEMBER_ROLES]';
			$project_assigned_title = '[CREATOR_NAME] has added you to a project';

			// Encode the content back to JSON
			$updated_content = json_encode($project_assigned_content);

			// Update the content column in the database
			$updated = $wpdb->update(
				$table_name,
				[
					'content' => $updated_content,
					'mobile_notification_title' => $project_assigned_title
				],
				['id' => $project_assigned_template['id']]
			);

			if ($updated === false) {
				$all_updated = false;
			}
		}

		$task_assigned_template = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id, content, mobile_notification_title FROM {$table_name} WHERE notification_action_name = %s",
				'lazytask_task_assigned_member'
			),
			ARRAY_A
		);

		if ($task_assigned_template) {
			// Decode the content JSON
			$task_assigned_content = json_decode($task_assigned_template['content'], true);

			// Update the mobile value
			$task_assigned_content['mobile'] = '[TASK_NAME]';
			$task_assigned_title = '[CREATOR_NAME] has assigned you a task.';

			// Encode the content back to JSON
			$task_updated_content = json_encode($task_assigned_content);

			// Update the content column in the database
			$updated = $wpdb->update(
				$table_name,
				[
					'content' => $task_updated_content,
					'mobile_notification_title' => $task_assigned_title
				],
				['id' => $task_assigned_template['id']]
			);

			if ($updated === false) {
				$all_updated = false;
			}
		}

		if ($all_updated) {
			update_option('lazytask_mobile_channel_update_done', true);
			error_log("✅ Notification templates updated successfully for mobile channel (first time).");
		} else {
			error_log("⚠️ Some updates failed — option not marked as complete.");
		}

	}

	private static function update_user_registration_email_notification_template()
	{
		global $wpdb;
		$table_name = LAZYTASK_TABLE_PREFIX . 'notification_templates';

		$current_time = gmdate('Y-m-d H:i:s');

		// Check if update was already done
		$already_updated = get_option('lazytask_user_registration_email_update_done');
		if ($already_updated) {
			return;
		}

		$user_registration_template = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id, content FROM {$table_name} WHERE notification_action_name = %s",
				'lazytask_user_registration'
			),
			ARRAY_A
		);

		if ($user_registration_template) {
			// Decode the content JSON
			$user_registration_content = json_decode($user_registration_template['content'], true);

			$user_registration_content['email'] = 'Welcome to LazyTasks,

You have been invited to the LazyTasks Project and Task Management system by [NAME].

Please find your username and password below.
Username: [USERNAME]
Password: [PASSWORD]

Please click here to join: [LOGIN_URL]

We recommend you change your password once logged in.

Thanks.
System Notification';

			// Encode the content back to JSON
			$updated_content = json_encode($user_registration_content);

			// Update the content column in the database
			$updated = $wpdb->update(
				$table_name,
				[
					'content' => $updated_content,
					'updated_at' => $current_time
				],
				['id' => $user_registration_template['id']]
			);

			if ($updated !== false) {
				update_option('lazytask_user_registration_email_update_done', true);
				error_log("✅ User registration email notification template updated successfully.");
			} else {
				error_log("⚠️ Failed to update user registration email notification template.");
			}
		}
	}

	// Function for update subtask serial no
	private static function update_subtask_serial_no()
	{
		global $wpdb;
		$tasks_table = LAZYTASK_TABLE_PREFIX . 'tasks';

		// Get all subtasks
		$subtasks = $wpdb->get_results("
			SELECT id, parent_id, serial_no
			FROM $tasks_table
			WHERE parent_id IS NOT NULL
			AND deleted_at IS NULL
			ORDER BY parent_id ASC, created_at ASC
		");

		$currentParentId = null;
		$serial = 0;

		foreach ($subtasks as $subtask) {
			// Start a new sequence when parent changes
			if ($currentParentId !== $subtask->parent_id) {
				$currentParentId = $subtask->parent_id;
				$serial = 1;
			} else {
				$serial++;
			}

			// Skip if serial_no already exists (optional)
			if (!is_null($subtask->serial_no)) {
				continue;
			}

			// Update subtask serial number
			$wpdb->update(
				$tasks_table,
				['serial_no' => $serial],
				['id' => $subtask->id]
			);
		}
	}

	private static function new_task_actions_permission_entry()
	{
		global $wpdb;
		$permissionTable = LAZYTASK_TABLE_PREFIX . 'permissions';
		$rolesTable = LAZYTASK_TABLE_PREFIX . 'roles';
		$roleHasPermissionTable = LAZYTASK_TABLE_PREFIX . 'role_has_permissions';

		$permissions = [
			[
				'name' => 'complete-task',
				'description' => 'Complete Task',
				'permission_group' => 'Tasks'
			],
			[
				'name' => 'change-section',
				'description' => 'Change Section of Task',
				'permission_group' => 'Tasks'
			],
			[
				'name' => 'add-remove-task-to-gantt',
				'description' => 'Add/Remove Task & Subtask to Gantt',
				'permission_group' => 'Tasks'
			],
			[
				'name' => 'view-archived-tasks',
				'description' => 'View Archived Tasks/Sections',
				'permission_group' => 'Tasks'
			],
			[
				'name' => 'convert-task',
				'description' => 'Convert Task',
				'permission_group' => 'Tasks'
			],
			[
				'name' => 'subtask-complete-incomplete',
				'description' => 'Subtask Complete/Incomplete',
				'permission_group' => 'Tasks'
			],
			[
				'name' => 'add-remove-section-to-gantt',
				'description' => 'Add/Remove Section to Gantt',
				'permission_group' => 'Section'
			],
			[
				'name' => 'project-archive-unarchive',
				'description' => 'Project Archive/Unarchive',
				'permission_group' => 'Projects'
			],
			[
				'name' => 'configure-project-tabs',
				'description' => 'Configure Project Tabs',
				'permission_group' => 'Projects'
			],
			[
				'name' => 'edit-whiteboard-comments',
				'description' => 'Edit Any Whiteboard Comments',
				'permission_group' => 'Whiteboard'
			],
			[
				'name' => 'delete-whiteboard-comments',
				'description' => 'Delete Any Whiteboard Comments',
				'permission_group' => 'Whiteboard'
			],
		];

		$created_permission_ids = [];
		foreach ($permissions as $permission) {
			$exists = $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $permissionTable WHERE name = %s",
				$permission['name']
			));

			if (!$exists) {
				$wpdb->insert($permissionTable, $permission);
				$created_permission_ids[] = $wpdb->insert_id;
			}
		}

		$whiteboardComments = "whiteboard-comments";
		$fetchPermissionId = $wpdb->get_var($wpdb->prepare(
			"SELECT id FROM $permissionTable WHERE name = %s",
			$whiteboardComments
		));
		if ($fetchPermissionId) {
			$wpdb->update(
				$permissionTable,
				['description' => 'Add Whiteboard Comments'],
				['id' => $fetchPermissionId]
			);
		}

		$targetRoles = ['superadmin', 'admin', 'director', 'manager'];
		$roleIds = $wpdb->get_results("SELECT id, slug 
			FROM $rolesTable 
			WHERE slug IN ('" . implode("','", $targetRoles) . "')");
		
		if (!empty($roleIds)) {
			foreach ($roleIds as $role) {

				foreach ($created_permission_ids as $permission_id) {

					// Check if permission already assigned
					$rpExists = $wpdb->get_var($wpdb->prepare(
						"SELECT COUNT(*) FROM $roleHasPermissionTable WHERE role_id = %d AND permission_id = %d",
						$role->id,
						$permission_id
					));

					if (!$rpExists) {
						$wpdb->insert($roleHasPermissionTable, [
							'role_id' => $role->id,
							'permission_id' => $permission_id
						]);
					}
				}

			}
		}
	}

}