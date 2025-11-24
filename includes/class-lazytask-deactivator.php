<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/**
 * Fired during plugin deactivation
 *
 * @link       https://lazycoders.co
 * @since      1.0.0
 *
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/includes
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/includes
 * @author     lazycoders <info@lazycoders.co>
 */
class Lazytask_Deactivator {

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function deactivate() {
		if (defined('LAZYTASKS_PREMIUM_VERSION')) {
			activate_plugin( plugin_basename( __FILE__ ) ); // Deactivate our plugin
			wp_die('You must deactivate the "Lazytasks Premium Mobile App" plugin before deactivating this plugin.' );
		}
		// $login_page_id = get_option('lazytask_page_id');

		// if($login_page_id)
		// 	wp_delete_post($login_page_id, true);

		// delete_option('lazytask_page_id');

		delete_option('lazytask_do_activation_redirect');
		delete_option('lazytasks_config');


	}

}
