<?php

namespace Lazytask\Helper;
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

class Lazytask_SlugGenerator {
	public static function slug($title, $table_name, $field_name){
		global $wpdb;

		$db = Lazytask_DatabaseTableSchema::get_global_wp_db($wpdb);

		// Sanitize the title to create a slug
		$slug = sanitize_title($title);

		// Check if the slug already exists in the database
		$existing_slugs = $db->get_col($db->prepare(
			"SELECT {$field_name} FROM {$table_name} WHERE {$field_name} LIKE %s;", $slug.'%'));

		if(count($existing_slugs) > 0){
			// If the slug exists, append a number to it and increment it until we find a slug that doesn't exist in the database
			$i = 1;
			while(in_array(($slug.'-'.$i), $existing_slugs)){
				$i++;
			}
			$slug .= '-'.$i;
		}

		return $slug;
	}

}