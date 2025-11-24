<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/**
 * Fired during plugin activation
 *
 * @link       https://lazycoders.co
 * @since      1.0.0
 *
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/includes
 */

 use Lazytask\Helper\Lazytask_Helper_QR_Code;

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    Lazytask_Lazy_Task
 * @subpackage Lazytask_Lazy_Task/includes
 * @author     lazycoders <info@lazycoders.co>
 */
class Lazytask_Activator {

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function activate()
	{
		// Free QR Code Generator
		Lazytask_Helper_QR_Code::lazytask_preview_app_qrcode_generator();

		\Lazytask\Helper\Lazytask_DatabaseTableSchema::run();

		if( !defined('LAZYTASK_DB_VERSION') || get_option('lazytask_db_version')==='' || version_compare(get_option('lazytask_db_version'), LAZYTASK_DB_VERSION, '<') ) {
			update_option('lazytask_db_version', LAZYTASK_DB_VERSION, 'no');
			\Lazytask\Helper\Lazytask_DBMigrator::run();
		}

		// Create pages if not exist

		$login_page_id = get_option('lazytask_page_id');
		if(!$login_page_id){
			self::create_pages();
		}

		$getLazytasksConfig = get_option('lazytasks_config');

		if( !$getLazytasksConfig ){

			self::lazytaskConfig();

		}

	}

	public static function lazytaskConfig()
	{
		$allProjects = \Lazytask\Helper\Lazytask_DatabaseQuerySchema::getAllProjects();

		$lazytasksConfig = [
			'lazytasks_version' => LAZYTASK_VERSION,
			'lazytasks_basic_info_guide_modal' => ! ( sizeof( $allProjects ) > 0 ),
			'step_completed' => sizeof( $allProjects ) > 0 ? 4 : 0,
		];

		update_option('lazytasks_config', wp_json_encode($lazytasksConfig));

		update_option('lazytask_do_activation_redirect', 1);

	}

	private static function create_pages()
	{
		// Check if the page already exists
		$login_page_id = get_option('lazytask_page_id');
		if(!$login_page_id || !get_post_status($login_page_id)) {
			$pages = array(
				'LazyTasks' => 'lazytasks',
			);
			foreach ($pages as $title => $page_slug) {
				$saved_page_args = array(
					'post_title'   => $title,
					'slug' => $page_slug,
					'post_name' => $page_slug,
					'post_content' => '',
					'post_status'  => 'publish',
					'post_type'    => 'page',
					'page_template' => plugin_dir_path( dirname( __FILE__ ) ) .'templates/lazytask-page-template.php',
				);


				// Insert the page and get its id.
				$saved_page_id = wp_insert_post( $saved_page_args );
				if($title == 'LazyTasks')
					// Save page id to the database.
					add_option( 'lazytask_page_id', $saved_page_id );
				// Save  id to the database.
			}
		}
	}



}
