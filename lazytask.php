<?php
/**
 * The plugin bootstrap file
 *
 * @link              https://lazycoders.co
 * @since             1.0.0
 * @package           Lazytask_Lazy_Task
 *
 * @wordpress-plugin
 * Plugin Name:       LazyTasks - Project & Task Management with Collaboration, Kanban and Gantt Chart
 * Plugin URI:        https://lazycoders.co/lazytasks
 * Description:       Comprehensive Task and Project Management: Create, assign, follow, and comment on tasks with ease. Our user-friendly interface ensures your projects are always on track and accessible.
 * Version:           1.2.35
 * Requires at least: 6.2
 * Tested up to:      6.8.3
 * Requires PHP:      7.4
 * Author:            Lazycoders
 * Author URI:        https://lazycoders.co
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       lazytasks-project-task-management
 * Domain Path:       /languages
 */
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

global $wpdb;
/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'LAZYTASK_VERSION', '1.2.35' );

define( 'LAZYTASK_DB_VERSION', '1.1.88' );

define( 'LAZYTASK_TABLE_PREFIX', $wpdb->prefix .'pms_' );

const LAZYTASK_JWT_SECRET_KEY = SECURE_AUTH_KEY;

define('LAZYTASK_APP_BUILDER_RESOURCE_URL', 'https://dev-app.appza.net');
// define('LAZYTASK_APP_BUILDER_RESOURCE_URL', 'https://live.appza.net');


/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-lazytask-activator.php
 */
function lazytask_activate() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-lazytask-activator.php';
	Lazytask_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-lazytask-deactivator.php
 */
function lazytask_deactivate() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-lazytask-deactivator.php';
	Lazytask_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'lazytask_activate' );
register_deactivation_hook( __FILE__, 'lazytask_deactivate' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-lazy-task.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function lazytask_run() {

	$plugin = new Lazytask_Lazy_Task();
	$plugin->run();

}
lazytask_run();

require_once "vendor/autoload.php";
