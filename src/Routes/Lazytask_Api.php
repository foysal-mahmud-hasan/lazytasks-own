<?php

namespace Lazytask\Routes;

use Lazytask\Controller\Lazytask_CompanyController;
use Lazytask\Controller\Lazytask_MyZenTaskController;
use Lazytask\Controller\Lazytask_NotificationController;
use Lazytask\Controller\Lazytask_ProjectController;
use Lazytask\Controller\Lazytask_SettingController;
use Lazytask\Controller\Lazytask_TagController;
use Lazytask\Controller\Lazytask_TaskController;
use Lazytask\Controller\Lazytask_UserController;
use WP_REST_Server;

class Lazytask_Api {
	CONST ROUTE_NAMESPACE = 'lazytasks/api/v1';
	public function register_routes(){

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/jwt-auth/login',
			array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array(new Lazytask_UserController(), 'jwt_auth_generate_token'),
			'permission_callback' => '__return_true',
			'args' => array(
				'email' => array(
					'required' => true,
					'validate_callback' => function($param, $request, $key){
						return $param;
					}
				),
				'password' => array(
					'required' => true,
					'validate_callback' => function($param, $request, $key){
						return $param;
					}
				)
			)
		));

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/google/login',
			array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array(new Lazytask_UserController(), 'google_login'),
			'permission_callback' => '__return_true',
			'args' => array(
				'token' => array(
					'required' => true,
					'validate_callback' => function($param) {
						return is_string($param) && !empty($param);
					}
				)
			)
		));

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/forget-password-request',
			array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array(new Lazytask_UserController(), 'lazytask_forget_password_request'),
			'permission_callback' => '__return_true',
			'args' => array(
				'email' => array(
					'required' => true,
					'validate_callback' => function($param, $request, $key){
						return $param;
					}
				)
			)
		));

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/change-password',
			array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array(new Lazytask_UserController(), 'lazytask_change_password'),
			'permission_callback' => '__return_true'
		));
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/forget-password-store',
			array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array(new Lazytask_UserController(), 'lazytask_forget_password_store'),
			'permission_callback' => '__return_true'
		));

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/jwt-auth/verified',
			array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array(new Lazytask_UserController(), 'validate_token'),
			'permission_callback' => '__return_true',
			'args' => array()
		));

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/admin/after-login/token',
			array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array(new Lazytask_UserController(), 'admin_after_auth_login'),
			'permission_callback' => '__return_true',
			'args' => array()
		));

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/login',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_UserController(), 'login'),
				'permission_callback' => '__return_true',
				'args' => array(
					'email' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'password' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/logout', array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_UserController(), 'logout_user'),
				'permission_callback' => '__return_true',
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/users/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_UserController(), 'update'),
				'permission_callback' => '__return_true',
				/*'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['superadmin', 'admin']);
				},*/
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/user/role/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_UserController(), 'userRoleUpdate'),
				'permission_callback' => '__return_true',
				/*'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['superadmin', 'admin']);
				},*/
				//'permission_callback' => array(new UserController(), 'permission_check'),
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/all-members',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_UserController(), 'getAllMembers'),
				'permission_callback' => '__return_true',
//				'permission_callback' => array(new UserController(), 'permission_check'),
				/*'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['superadmin', 'admin']);
				},*/
				'args' => array()
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/all-invited-members',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_UserController(), 'getAllInvitedMembers'),
				'permission_callback' => '__return_true',
//				'permission_callback' => array(new UserController(), 'permission_check'),
				/*'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['superadmin', 'admin']);
				},*/
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/users/show/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_UserController(), 'show'),
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
//				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/sign-up',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_UserController(), 'signUp'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-member-to-project-send-invite']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/lazy-link/create/role',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_UserController(), 'createLazyLinkRole'),
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/lazy-link/role/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_UserController(), 'updateLazyLinkRole'),
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
				'args' => array()
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/lazy-link/role/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_UserController(), 'deleteLazyLinkRole'),
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/lazy-link/roles',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_UserController(), 'lazyLinkRoles'),
//				'permission_callback' => '__return_true',
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
				'args' => array()
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/lazy-link/permissions',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_UserController(), 'lazyLinkPermissions'),
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
				'args' => array()
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/lazy-link/role/permissions',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_UserController(), 'getRolePermissions'),
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/lazy-link/role/permissions',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_UserController(), 'updateRolePermissions'),
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/companies',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_CompanyController(), 'index'),
//				'permission_callback' => '__return_true',
				'permission_callback' => array(new Lazytask_UserController(), 'permission_check'),
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/companies/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_CompanyController(), 'create'),
//				'permission_callback' => '__return_true',
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-workspace']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/companies/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_CompanyController(), 'update'),
//				'permission_callback' => '__return_true',
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-workspace', 'edit-workspace', 'add-member-to-project-send-invite', 'remove-member-from-project']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/companies/show/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_CompanyController(), 'show'),
				'permission_callback' => '__return_true',
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/companies/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_CompanyController(), 'delete'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['delete-workspace']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/projects',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getAllProjects'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-project', 'create-workspace']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/projects/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_ProjectController(), 'create'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-project']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'company_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/projects/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_ProjectController(), 'update'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['edit-project', 'add-member-to-project-send-invite', 'remove-member-from-project']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/projects/nav/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_ProjectController(), 'updateProjectNavSettings'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['configure-project-tabs']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/projects/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_ProjectController(), 'delete'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['delete-project']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/projects/sections/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getTaskSectionsByProjectId'),
				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/projects/priorities/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getPrioritiesByProjectId'),
				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/projects/status/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getStatusByProjectId'),
				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/project/archive/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_ProjectController(), 'archiveProject'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['project-archive-unarchive']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/project/unarchive/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_ProjectController(), 'unarchiveProject'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['project-archive-unarchive']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/install-activate/addon',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_SettingController(), 'installActivateAddon'),
				'permission_callback' => '__return_true',
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['addon-install']);
				},
				'args' => array(
					'addon' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/deactivate/addon',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_SettingController(), 'toggleAddonStatus'),
				'permission_callback' => '__return_true',
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['addon-install']);
				},
				'args' => array(
					'addon' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/project-overview/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getProjectOverview'),
				// 'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						// 'type' => 'integer',
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
			)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/project/(?P<project_id>\d+)/section/(?P<section_slug>[a-zA-Z0-9-_]+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getTasksBySection'),
				// 'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'project_id' => array( // ✅ FIXED from 'id'
						'required' => true,
						'validate_callback' => function($param, $request, $key) {
							return is_numeric($param); // ✅ Optional: add actual validation
						}
					),
					'section_slug' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key) {
							return is_string($param);
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/project/(?P<project_id>\d+)/priority/tasks',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getTasksByPriority'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key) {
							return is_numeric($param);
						}
					),
					'priority_id' => array(
						'required' => false,
						'validate_callback' => function($param, $request, $key) {
							return $param === 'none' || $param === null || is_numeric($param);
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/project/(?P<project_id>\d+)/status/tasks',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getTasksByStatus'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key) {
							return is_numeric($param);
						}
					),
					'status_id' => array(
						'required' => false,
						'validate_callback' => function($param, $request, $key) {
							return $param === 'none' || $param === null || is_numeric($param);
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/project/(?P<project_id>\d+)/member/tasks',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getTasksByMember'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key) {
							return is_numeric($param);
						}
					),
					'member_id' => array(
						'required' => false,
						'validate_callback' => function($param, $request, $key) {
							return $param === 'none' || $param === null || is_numeric($param);
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/project/(?P<project_id>\d+)/duedate/(?P<date_type>[a-zA-Z0-9_-]+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getTasksByDueDate'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key) {
							return is_numeric($param);
						}
					),
					'date_type' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key) {
							return is_string($param);
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/by/project/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getTasksByProjectId'),
				// 'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						// 'type' => 'integer',
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
			)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/gantt-tasks/by/project/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'getGanttTasksByProjectId'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
//						'type' => 'integer',
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
			)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/by/user/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_UserController(), 'getTaskByLoggedInUserId'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
//						'type' => 'integer',
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
			)
			)
		);

		//taskSection section start
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/sections/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'createTaskSection'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-manage-section']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/sections/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'updateTaskSection'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-manage-section']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/sections/mark-is-complete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'markIsCompleteTaskSection'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['mark-as-complete']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/sections/archive/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'archiveTaskSection'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['archive-section', 'archive-all-tasks', 'archive-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/sections/unarchive/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'unarchiveTaskSection'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['archive-section', 'archive-all-tasks', 'archive-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/archiveList',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'archiveTaskList'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-archived-tasks']);
				},
				// 'args' => array(
				// 	'id' => array(
				// 		'required' => true,
				// 		'validate_callback' => function($param, $request, $key){
				// 			return $param;
				// 		}
				// 	)
				// )
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/complete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'taskComplete'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['subtask-complete-incomplete', 'complete-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/incomplete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'taskInComplete'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['subtask-complete-incomplete']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/subtasks/convert/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'convertToTask'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['convert-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/change-privacy/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'changeTaskPrivacy'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-task', 'edit-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/task/copy/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'copyTask'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-task', 'edit-task', 'duplicate-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/section/copy/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'copyTaskSection'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-manage-section', 'duplicate-section']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/section-tasks/toggole/gantt/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'toggleSectionTasksGanttView'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-remove-section-to-gantt']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/sections/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'softDeleteTaskSection'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-manage-section']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/sections/sort-order/update',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'updateSectionSortOrder'),
				'permission_callback' => '__return_true',
				'args' => array(
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		//priority section start
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/priorities/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_ProjectController(), 'createProjectPriority'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-remove-priority']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/priorities/delete',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'deleteProjectPriority'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-remove-priority']);
				},
				'args' => array()
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/priorities/sortOrder/update',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_ProjectController(), 'updateProjectPrioritySortOrder'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-remove-priority']);
				},
				'args' => array()
			)
		);

		// project Status create
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/status/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_ProjectController(), 'createProjectStatus'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-remove-status']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/status/delete',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_ProjectController(), 'deleteProjectStatus'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-remove-status']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/status/sortOrder/update',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_ProjectController(), 'updateProjectStatusSortOrder'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-remove-status']);
				},
				'args' => array()
			)
		);

		//task section start

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'create'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-task']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'update'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					// return $userController->permission_check($request, ['edit-task', 'add-attachments', 'change-priority', 'change-status', 'delete-attachments', 'assign-task-to-member', 'assign-follower']);
					if ($userController->permission_check($request, ['edit-task', 'add-attachments', 'change-priority', 'change-status', 'delete-attachments', 'assign-task-to-member', 'assign-follower', 'add-remove-task-to-gantt'])) {
						return true;
					}
					if ($userController->can_edit_delete_task($request)) {
						return true;
					}
					return false;
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/show/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'show'),
				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
			)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'delete'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					// Check permission OR Loggedin user is task creator
					if ($userController->permission_check($request, ['delete-task'])) {
						return true;
					}
					if ($userController->can_edit_delete_task($request)) {
						return true;
					}
					return false;
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/sort-order/update',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'updateTaskSortOrder'),
				'permission_callback' => '__return_true',
				'args' => array(
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/tag/assign',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'tagAssignToTask'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-task', 'edit-task']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/tag/remove',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'tagRemoveFromTask'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['create-task', 'edit-task']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'task_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/comments/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'createComment'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-comments']);
				},
				'args' => array(
					'content' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'user_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'commentable_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/comments/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'softDeleteComment'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					// return $userController->permission_check($request, ['delete-comments']);
					// Check permission OR Loggedin user is task creator
					if ($userController->permission_check($request, ['delete-comments'])) {
						return true;
					}
					if ($userController->can_delete_comment($request)) {
						return true;
					}
					return false;
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/attachments/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'createAttachment'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['add-attachments']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/attachments/upload',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'uploadAttachment'),
				'permission_callback' => '__return_true',
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/attachments/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'deleteAttachment'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					// return $userController->permission_check($request, ['delete-attachments']);
					// Check permission OR Loggedin user is task creator
					if ($userController->permission_check($request, ['delete-attachments'])) {
						return true;
					}
					if ($userController->can_delete_attachment($request)) {
						return true;
					}
					return false;
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/attachments/remove/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'removeAttachment'),
				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		//tags section start
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tags',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TagController(), 'getAllTags'),
//				'permission_callback' => array(new UserController(), 'permission_check'),
				'permission_callback' => '__return_true',
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tags/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TagController(), 'create'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['manage-tags']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tags/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TagController(), 'delete'),
				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'required' => true,
						//'type' => 'integer',
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);


		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/quick-tasks/by/user/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_UserController(), 'getQuickTaskByLoggedInUserId'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
//						'type' => 'integer',
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/quick-tasks/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::DELETABLE,
				'callback' => array(new Lazytask_TaskController(), 'quickTaskDelete'),
				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'required' => true,
//						'type' => 'integer',
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/quick-tasks/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_TaskController(), 'quickTaskCreate'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task']);
				},
				'args' => array(
					'name' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		// Dashboard task count
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/dashboard/task-count',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'getDashboardTaskCount'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access']);
				},
				'args' => array()
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/dashboard/members/task-count',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'getMembersTaskCount'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access']);
				},
				'args' => array()
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/dashboard/project/pie-chart/data',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'getProjectPriorityTaskCount'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/activity-log/by/user/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'getActivityLogByUserId'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/mytasks/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_TaskController(), 'getUserTasksByDate'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
			)
			)
		);

		// send feedback
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/send-feedback',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_SettingController(), 'sendFeedback'),
				'permission_callback' => '__return_true',
				'args' => array()
			)
		);

		// notification section

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notifications',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_NotificationController(), 'getNotificationHistoryByUserId'),
				'permission_callback' => '__return_true',
				'args' => array()
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notifications/status/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_NotificationController(), 'changeNotificationStatus'),
				'permission_callback' => '__return_true',
				'args' => array(
					'user_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notifications/mark-all-read',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_NotificationController(), 'markAllNotificationsAsRead'),
				'permission_callback' => '__return_true',
				'args' => array(
					'user_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notification-action-list',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_NotificationController(), 'getNotificationActionList'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['manage-notifications']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notification-channels',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_NotificationController(), 'getNotificationChannels'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['manage-notifications']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notification-templates',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_NotificationController(), 'getNotificationTemplates'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['manage-notifications']);
				},
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notification-templates/create',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array(new Lazytask_NotificationController(), 'createNotificationTemplate'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['manage-notifications']);
				},
				'args' => array(
					'title' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notification-templates/show/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_NotificationController(), 'showNotificationTemplate'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['manage-notifications']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		//edit notification template
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notification-templates/edit/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_NotificationController(), 'editNotificationTemplate'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['manage-notifications']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					),
					'title' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		//delete notification template by id
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/notification-templates/delete/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::DELETABLE,
				'callback' => array(new Lazytask_NotificationController(), 'deleteNotificationTemplate'),
				'permission_callback' => function($request) {
					$userController = new Lazytask_UserController();
					return $userController->permission_check($request, ['manage-notifications']);
				},
				'args' => array(
					'id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/translate', [
			'methods' => WP_REST_Server::READABLE,
			'callback' => [ new Lazytask_SettingController(), 'translate_strings'],
			'permission_callback' => function($request) {
				$userController = new Lazytask_UserController();
				return $userController->permission_check($request, ['view-only-access']);
			},
		]);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/settings', [
			'methods' => WP_REST_Server::READABLE,
			'callback' => [ new Lazytask_SettingController(), 'get_settings'],
//			'permission_callback' => '__return_true',
			'permission_callback' => function($request) {
				$userController = new Lazytask_UserController();
				return $userController->permission_check($request, ['view-only-access', 'create-task', 'edit-task', 'general-settings']);
			},
		]);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/settings', [
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => [new Lazytask_SettingController(), 'update_settings'],
//			'permission_callback' => '__return_true',
			'permission_callback' => function($request) {
				$userController = new Lazytask_UserController();
				return $userController->permission_check($request, ['general-settings']);
			},
		]);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/social-login/on-off', [
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => [new Lazytask_SettingController(), 'updateSocialLoginSettings'],
			// 'permission_callback' => '__return_true',
			'permission_callback' => function($request) {
				$userController = new Lazytask_UserController();
				return $userController->permission_check($request, ['general-settings']);
			},
		]);
		
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/portal-settings', [
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => [new Lazytask_SettingController(), 'update_portal_settings'],
//			'permission_callback' => '__return_true',
			'permission_callback' => function($request) {
				$userController = new Lazytask_UserController();
				return $userController->permission_check($request, ['general-settings']);
			},
		]);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/edit-license-modal-status',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_SettingController(), 'editLicenseModalStatus'),
				'permission_callback' => '__return_true',
				'args' => array()
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/my-zen', [
			'methods' => WP_REST_Server::READABLE,
			'callback' => [new Lazytask_MyZenTaskController(), 'getAllMyZenTasks'],
			'permission_callback' => '__return_true',
		]);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/my-zen/create', [
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => [new Lazytask_MyZenTaskController(), 'create'],
			'permission_callback' => '__return_true',
			'args' => array(
				'name' => array(
					'required' => true,
					'validate_callback' => function($param, $request, $key){
						return $param;
					}
				)
			)
		]);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/my-zen/edit/(?P<id>\d+)', [
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => [new Lazytask_MyZenTaskController(), 'update'],
			'permission_callback' => '__return_true',
			'args' => array(
				'id' => array(
					'required' => true,
					'validate_callback' => function($param, $request, $key){
						return $param;
					}
				)
			)
		]);

		//getLazytaskConfig
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/settings/config', [
			'methods' => WP_REST_Server::READABLE,
			'callback' => [new Lazytask_SettingController(), 'getLazytaskConfig'],
			'permission_callback' => '__return_true',
		]);

		//getLazytaskConfig
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/settings/config/update', [
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => [new Lazytask_SettingController(), 'updateLazytaskConfig'],
			'permission_callback' => '__return_true',
		]);

		// Domain Validation
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/domain-validation',
			array(
				'method' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_SettingController(), 'domainValidationCheck'),
				'permission_callback' => '__return_true',
				'args' => array()
			)
		);
		// Timezone Options
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/timezone-options',
			array(
				'method' => WP_REST_Server::READABLE,
				'callback' => array(new Lazytask_SettingController(), 'getTimezoneOptions'),
				'permission_callback' => '__return_true',
				'args' => array()
			)
		);

		//updateGanttTaskSortOrder
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'/tasks/gantt-sort-order/update',
			array(
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => array(new Lazytask_TaskController(), 'updateGanttTaskSortOrder'),
				'permission_callback' => '__return_true',
				'args' => array(
					'project_id' => array(
						'required' => true,
						'validate_callback' => function($param, $request, $key){
							return $param;
						}
					)
				)
			)
		);

	}

}