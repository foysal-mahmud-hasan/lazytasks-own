<?php

/**
 * Fired when the plugin is uninstalled.
 *
 * When populating this file, consider the following flow
 * of control:
 *
 * - This method should be static
 * - Check if the $_REQUEST content actually is the plugin name
 * - Run an admin referrer check to make sure it goes through authentication
 * - Verify the output of $_GET makes sense
 * - Repeat with other user roles. Best directly by using the links/query string parameters.
 * - Repeat things for multisite. Once for a single site in the network, once sitewide.
 *
 * This file may be updated more in future version of the Boilerplate; however, this is the
 * general skeleton and outline for how the file should work.
 *
 * For more information, see the following discussion:
 * https://github.com/tommcfarlin/WordPress-Plugin-Boilerplate/pull/123#issuecomment-28541913
 *
 * @link       https://lazycoders.co
 * @since      1.0.0
 *
 * @package    Lazytask_Lazy_Task
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Get the page ID stored in plugin option
$login_page_id = get_option('lazytask_page_id');

// Delete the page if it exists
if ($login_page_id && get_post_status($login_page_id)) {
    wp_delete_post($login_page_id, true); // true = force delete (bypasses trash)
}

// Remove the stored option
delete_option('lazytask_page_id');