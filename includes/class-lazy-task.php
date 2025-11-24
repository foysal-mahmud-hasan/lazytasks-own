<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://lazycoders.co
 * @since      1.0.0
 *
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/includes
 * @author     lazycoders <info@lazycoders.co>
 */
class Lazytask_Lazy_Task {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Lazytask_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		if ( defined( 'LAZYTASK_VERSION' ) ) {
			$this->version = LAZYTASK_VERSION;
		} else {
			$this->version = '1.2.35';
		}
		$this->plugin_name = 'lazytasks-project-task-management';

		$this->lazytask_load_dependencies();
		$this->lazytask_set_locale();
		$this->lazytask_define_admin_hooks();
		$this->lazytask_define_public_hooks();
        $this->lazytask_includes();

	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Lazytask_Loader. Orchestrates the hooks of the plugin.
	 * - Lazytask_i18n. Defines internationalization functionality.
	 * - Lazytask_Admin. Defines all hooks for the admin area.
	 * - Lazytask_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function lazytask_load_dependencies() {

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-lazytask-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-lazytask-i18n.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-lazytask-admin.php';

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'public/class-lazytask-public.php';

		$this->loader = new Lazytask_Loader();

	}

    private function lazytask_includes() {
        require plugin_dir_path(  dirname( __FILE__ ) ) . 'src/Notification/includes/functions.php';
        require plugin_dir_path(  dirname( __FILE__ ) ) . 'src/Notification/includes/Integrations.php';

    }

    /**
     * Define the locale for this plugin for internationalization.
     *
     * Uses the Lazytask_i18n class in order to set the domain and to register the hook
     * with WordPress.
     *
     * @since    1.0.0
     * @access   private
     */
    private function lazytask_set_locale() {

        $plugin_i18n = new Lazytask_i18n();

        $this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'lazytask_load_plugin_textdomain' );

    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function lazytask_define_admin_hooks() {

        $plugin_admin = new Lazytask_Admin( $this->get_plugin_name(), $this->get_version() );

//		$this->loader->add_action( 'plugins_loaded', $plugin_admin, 'my_plugin_set_db' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'lazytask_enqueue_styles' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'lazytask_enqueue_scripts' );
	    $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'lazytask_redirect' );
        $this->loader->add_action( 'admin_menu', $plugin_admin, 'lazytask_admin_menu' );
        $this->loader->add_action( 'admin_bar_menu', $plugin_admin, 'lazytask_admin_bar_menu', 100 );
        $this->loader->add_action( 'rest_api_init', $plugin_admin, 'lazytask_admin_routes' );
        $this->loader->add_action( 'wp_login', $plugin_admin, 'lazytask_auth_login');
        $this->loader->add_action( 'init', $this, 'lazytask_add_user_role' );
        $this->loader->add_filter( 'theme_page_templates', $this, 'lazytask_add_page_template_to_dropdown' );
        $this->loader->add_filter( 'template_include', $this, 'lazytask_load_plugin_template' );
        $this->loader->add_filter( 'show_admin_bar', $this, 'lazytask_hide_admin_bar' );
	    $this->loader->add_action( 'admin_init', $plugin_admin, 'lazytask_database_migrate' );
        $this->loader->add_action( 'load-post.php', $plugin_admin, 'lazytask_protect_page_edit' );
        $this->loader->add_action( 'load-post-new.php', $plugin_admin, 'lazytask_protect_page_edit' );
        $this->loader->add_action( 'pre_get_posts', $plugin_admin, 'exclude_lazytasks_page_from_pages' );
    }
    
    function lazytask_hide_admin_bar()
    {
        $page_id = get_option('lazytask_page_id');
        if ( $page_id && is_page($page_id) ) {
            return false;
        }else{
            return true;
        }
    }

    /**
     * Add page templates.
     *
     * @param  array  $templates  The list of page templates
     *
     * @return array  $templates  The modified list of page templates
     */
    public function lazytask_add_page_template_to_dropdown( $templates )
    {
        //$templates[plugin_dir_path( dirname( __FILE__ ) ) . 'templates/lazytask-page-template.php'] = __( 'LazyTasks', 'lazytasks-project-task-management' );

        return $templates;
    }
    /**
     * Check if current page has our custom template. Try to load
     * template from theme directory and if not exist load it
     * from root plugin directory.
     */
    function lazytask_load_plugin_template( $template ) {

        $page_id = get_option('lazytask_page_id');
        if ( $page_id && is_page($page_id) ) {
            $plugin_template = plugin_dir_path( dirname( __FILE__ ) ) . 'templates/lazytask-page-template.php';
            if ( file_exists( $plugin_template ) ) {
                return $plugin_template;
            } else {
                throw new \Exception('No template found');
            }
        }
        return $template;
    }

    /**
     * Register all of the hooks related to the public-facing functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function lazytask_define_public_hooks() {

        $plugin_public = new Lazytask_Public( $this->get_plugin_name(), $this->get_version() );

        $this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'lazytask_enqueue_styles' );
        $this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'lazytask_enqueue_scripts' );

    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run() {
        $this->loader->run();
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of
     * WordPress and to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * The reference to the class that orchestrates the hooks with the plugin.
     *
     * @since     1.0.0
     * @return    Lazytask_Loader    Orchestrates the hooks of the plugin.
     */
    public function get_loader() {
        return $this->loader;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }

    function lazytask_add_user_role() {
        add_role( 'lazytasks_role', 'LazyTasks User',
            array(
                'lazytasks_role' => true
            )
        );

        $rolesArray = array('administrator', 'editor', 'author', 'contributor');
        global $wp_roles;
        foreach ( $wp_roles as  $role_obj )
        {

            if(is_array($role_obj)){
                foreach ( $role_obj as $key=>$roleName )
                {
                    if(in_array($key, $rolesArray))
                    {
                        $role = get_role( $key);
                        $role->add_cap( 'lazytasks_role', true );
                    }

                }
            }
        }
    }

}
