<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://lazycoders.co
 * @since      1.0.0
 *
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 *
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/public
 * @author     lazycoders <info@lazycoders.co>
 */
class Lazytask_Public {

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
	 * @param      string    $plugin_name       The name of the plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;

	}

	/**
	 * Register the stylesheets for the public-facing side of the site.
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

		$lazytask_page_id = get_option('lazytask_page_id');

		if (is_page($lazytask_page_id)) {
			if(get_post_status() === 'publish'){
				// phpcs:ignore WordPress.WP.EnqueuedStylesScope
				wp_enqueue_style( 'lazytasks-style', plugin_dir_url( __DIR__ ) . 'admin/frontend/build/index.css', array(), $this->version, 'all');
			}else{
				// redirect to home page
				wp_redirect(home_url());
            	exit;
			}
		}

	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
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

		$lazytask_page_id = get_option('lazytask_page_id');

		if (is_page($lazytask_page_id)) {
			if(get_post_status() === 'publish'){
				// phpcs:ignore WordPress.WP.EnqueuedScriptsScope
				wp_enqueue_script('lazytasks-script', plugin_dir_url( __DIR__ ) . 'admin/frontend/build/index.js', array('jquery', 'wp-element'), LAZYTASK_VERSION, true);
				
				$license_status = get_option('lazytask_license_activate');
    			$premium_installed = get_option('lazytask_premium_installed');
				$whiteboard_installed = get_option('lazytasks_whiteboard_installed');
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

				wp_localize_script('lazytasks-script', 'appLocalizer', [
					'apiUrl' => home_url('/wp-json'),
					'homeUrl' => home_url(''),
					'nonce' => wp_create_nonce('wp_rest'),
					'i18n' => \Lazytask\Services\TransStrings::getStrings(),
					'licenseStatus' => $license_status,
        			'premiumInstalled' => $premium_installed,
        			'whiteboardInstalled' => $whiteboard_installed,
					'remainingDays' => $days_diff ?? 0,
				]);
			}else{
				// redirect to home page
				wp_redirect(home_url());
            	exit;
			}
		}
	}

}
