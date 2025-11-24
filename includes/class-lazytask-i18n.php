<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/**
 * Define the internationalization functionality
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @link       https://lazycoders.co
 * @since      1.0.0
 *
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/includes
 */

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @since      1.0.0
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/includes
 * @author     lazycoders <info@lazycoders.co>
 */
class Lazytask_i18n {


	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since    1.0.0
	 */
	public function lazytask_load_plugin_textdomain() {

		load_plugin_textdomain(
			'lazytasks-project-task-management',
			false,
			dirname( dirname( plugin_basename( __FILE__ ) ) ) . '/languages/'
		);

	}



}
