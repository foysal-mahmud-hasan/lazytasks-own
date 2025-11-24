<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://lazycoders.co
 * @since      1.0.0
 *
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/admin
 */

use Firebase\JWT\JWT;

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/admin
 * @author     lazycoders <info@lazycoders.co>
 */
class Lazytask_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $plugin_name       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;

	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function lazytask_enqueue_styles() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Lazytask_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Lazytask_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if (isset($_REQUEST['page']) && str_contains($_REQUEST['page'], 'lazytasks-page')){
			wp_enqueue_style( 'lazytasks-style', plugin_dir_url( __FILE__ ) . 'frontend/build/index.css', array(), $this->version, 'all');
		}
		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/pms-rbs-admin.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function lazytask_enqueue_scripts() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Lazytask_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Lazytask_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if (isset($_REQUEST['page']) && str_contains($_REQUEST['page'], 'lazytasks-page')) {
	        $userController = new \Lazytask\Controller\Lazytask_UserController();
			$userResponse = $userController->admin_after_auth_login();

            wp_enqueue_script('lazytasks-script', plugin_dir_url(__FILE__) . 'frontend/build/index.js', array('jquery', 'wp-element'), LAZYTASK_VERSION, true);
			
			$license_status = get_option('lazytask_license_activate');
			$premium_installed = get_option('lazytask_premium_installed');
			$lazytask_premium_activated_date = get_option('lazytask_premium_activated_date');
			//remaining days now to activation date
	        if ($lazytask_premium_activated_date) {
		        $activated_date = new DateTime($lazytask_premium_activated_date);
		        $current_date = new DateTime();
		        $interval = $current_date->diff($activated_date);
		        $days_diff = $interval->days;
		        if ($interval->invert == 0) {
			        $days_diff = -$days_diff; // If the activation date is in the future, make days_diff negative
		        }
	        }
			$whiteboard_installed = get_option('lazytasks_whiteboard_installed');
			
			wp_localize_script('lazytasks-script', 'appLocalizer', [
                'apiUrl' => home_url('/wp-json'),
                'homeUrl' => home_url(''),
                'nonce' => wp_create_nonce('wp_rest'),
	            'is_admin' => 1,
				'userResponse' => $userResponse,
				'i18n' => \Lazytask\Services\TransStrings::getStrings(),
				'licenseStatus' => $license_status,
				'premiumInstalled' => $premium_installed,
				'whiteboardInstalled' => $whiteboard_installed,
				'remainingDays' => $days_diff ?? 0,
			]);
        }


	}


    public function lazytask_admin_menu() {
		$lazytask_page_id = get_option('lazytask_page_id');
        add_menu_page(
            __("LazyTasks", "lazytasks-project-task-management"),
            __("LazyTasks", "lazytasks-project-task-management"),
            "lazytasks_role",
            "lazytasks-page",
            array($this, "lazytask_init"),
            "dashicons-layout",
            2
        );

		// Submenu Dashboard page
		add_submenu_page(
			"lazytasks-page",
			__("Dashboard", "lazytasks-project-task-management"),
			__("Dashboard", "lazytasks-project-task-management"),
			'lazytasks_role',
			'lazytasks-page',
			array($this, "lazytask_init"),
			1
		);
		// Submenu My Task page
		add_submenu_page(
			"lazytasks-page",
			__("My Tasks", "lazytasks-project-task-management"),
			__("My Tasks", "lazytasks-project-task-management"),
			'lazytasks_role',
			'lazytasks-page#/my-task',
			array($this, "lazytask_mytask"),
			2
		);
		if ($lazytask_page_id && get_post_status($lazytask_page_id) === 'publish'){
			// Submenu Portal page
			add_submenu_page(
				"lazytasks-page",
				__("Portal", "lazytasks-project-task-management"),
				__("Portal", "lazytasks-project-task-management"),
				'lazytasks_role',
				'lazytasks-portal',
				array($this, "lazytask_portal"),
				3
			);
		}
		// Submenu Settings page
		add_submenu_page(
			"lazytasks-page",
			__("Settings", "lazytasks-project-task-management"),
			__("Settings", "lazytasks-project-task-management"),
			'lazytasks_role',
			'lazytasks-page#/settings',
			array($this, "lazytask_settings"),
			4
		);
		// Submenu License page
		add_submenu_page(
			"lazytasks-page",
			__("License", "lazytasks-project-task-management"),
			__("License", "lazytasks-project-task-management"),
			'lazytasks_role',
			'lazytasks-page#/license',
			array($this, "lazytask_settings"),
			4
		);

    }

	//admin_ber_menu

	/**
	 * @return void
	 */
	public function lazytask_admin_bar_menu($wp_admin_bar) {
		$lazytask_page_id = get_option('lazytask_page_id');
		if ($lazytask_page_id && get_post_status($lazytask_page_id) === 'publish'){
			$base_url = get_permalink($lazytask_page_id);
			// Add custom link within site name dropdown
			$wp_admin_bar->add_node(array(
				'id'     => 'lazytask-portal-link',
				'title'  => __('Lazytasks Portal', 'lazytasks-project-task-management'),
				'href'   => $base_url,
				'parent' => 'site-name',
				'meta'   => [
					'title' => 'Click to visit lazytasks portal',
					'target' => '_blank', // Open in new tab
				],
			));
		}
	}

    public function lazytask_init() {
        echo "<div id='lazy_pms'></div> <div id='lazytasks-whiteboard'></div>";
    }
	public function lazytask_mytask() {
		echo "<div id='lazy_pms' aria-hidden='true'></div>";
	}
	public function lazytask_portal() {
		$lazytask_page_id = get_option('lazytask_page_id');
		$base_url = get_permalink($lazytask_page_id);
		if (!headers_sent()) {
			wp_safe_redirect($base_url);
			exit;
		}

		// Fallback if headers are already sent (not ideal)
		echo '<script>window.location.href = "' . esc_url($base_url) . '";</script>';
		echo '<noscript><meta http-equiv="refresh" content="0;url=' . esc_url($base_url) . '" /></noscript>';
	}

	public function lazytask_settings() {
        echo "<div id='lazy_pms' aria-hidden='true'></div>";
    }

	public function lazytask_admin_routes() {
		(new \Lazytask\Routes\Lazytask_Api())->register_routes();
	}

//add_filter('wp_authenticate_user', 'lazytask_auth_login',10,2);
    function lazytask_auth_login ($user_login) {
	    $user = get_user_by('login', $user_login );
	    wp_set_current_user($user->ID, $user->display_name);
	    wp_set_auth_cookie($user->ID, true, false);
	    setcookie('user_id', $user->ID, strtotime('+1 day'));

	}

	public function lazytask_redirect()
	{
		if ( (int)get_option( 'lazytask_do_activation_redirect' ) === 1 ) {
			update_option('lazytask_do_activation_redirect', 0 );
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			exit(esc_url(wp_safe_redirect(admin_url('admin.php?page=lazytasks-page'))));
		}

	}

	//database migration
	public function lazytask_database_migrate()
	{
		if( !defined('LAZYTASK_DB_VERSION') || get_option('lazytask_db_version')==='' || version_compare(get_option('lazytask_db_version'), LAZYTASK_DB_VERSION, '<') ) {
			update_option('lazytask_db_version', LAZYTASK_DB_VERSION, 'no');
			\Lazytask\Helper\Lazytask_DBMigrator::run();
		}

	}

	// Protect the page from being edited
	public function lazytask_protect_page_edit() {
		$page_id = (int) get_option('lazytask_page_id');
		if ( ! $page_id ) {
			return;
		}

		// Only block editing if this is the protected page
		if ( isset($_GET['post']) && (int) $_GET['post'] === $page_id ) {
			wp_die(
				__('You are not allowed to edit this page.', 'lazytask'),
				__('Access denied', 'lazytask'),
				array('response' => 403)
			);
		}
	}

	// exclude page from all pages list
	public function exclude_lazytasks_page_from_pages( $query ) {

		global $pagenow;
		if ( ! is_admin() || ! $query->is_main_query() ) {
			return;
		}

		$page_id = get_option('lazytask_page_id');
		if(!$page_id) return $query;

		$post_type = $query->get('post_type');
		if( 'edit.php' == $pagenow && ( $post_type && 'page' == $post_type ) ){
			$query->set( 'post__not_in', array( (int) $page_id ) );
		}
		return $query;
	}

}