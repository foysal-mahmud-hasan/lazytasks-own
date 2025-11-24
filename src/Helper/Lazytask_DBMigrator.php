<?php

namespace Lazytask\Helper;

use Lazytask\Helper\Migrations\Lazytask_TaskMigrator;

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

class Lazytask_DBMigrator {

	public static function run()
	{
		self::migrate();

		$qrCodeImage = get_option('lazytask_free_qr_code', '');
		if(!$qrCodeImage) {
			Lazytask_Helper_QR_Code::lazytask_preview_app_qrcode_generator();
		}

	}

	private static function migrate()
	{
		Lazytask_TaskMigrator::migrate();
	}

}