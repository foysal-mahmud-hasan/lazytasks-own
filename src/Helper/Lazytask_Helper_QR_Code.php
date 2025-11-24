<?php

namespace Lazytask\Helper;

use chillerlan\QRCode\Output\QROutputInterface;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

class Lazytask_Helper_QR_Code {

	public static function lazytask_preview_app_qrcode_generator(): array {


		$filename = 'preview_free_mobile_app_qrcode.png';

		$qr_options = new QROptions();
		$qr_options->outputType = QROutputInterface::GDIMAGE_PNG;

		$lazytaskSettings = get_option('lazytask_settings', []);
		$core_setting = isset($lazytaskSettings['core_setting']) && $lazytaskSettings['core_setting'] ? json_decode($lazytaskSettings['core_setting'], true) : [];
		$siteTitle= isset($core_setting['site_title']) && $core_setting['site_title'] ? $core_setting['site_title'] : get_option('blogname');
		$siteLogo = isset($core_setting['site_logo']) && $core_setting['site_logo'] ? $core_setting['site_logo'] : '';

		 $arrayData = [
		 	'domain' => get_site_url(),
		 	'title' => $siteTitle,
		 	'logo' => $siteLogo,
		 ];
		$domain = get_site_url();

		$qr_base64_string = (new QRCode($qr_options))->render(json_encode($arrayData));

		// Split the base64 string
		list($type, $data) = explode(';', $qr_base64_string);
		list(, $data) = explode(',', $data);

		// Decode the base64 string
		$data = base64_decode($data);

		// Determine the file path
		$upload_dir = wp_upload_dir();
		$upload_path = $upload_dir['path'] . '/' . $filename;

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents($upload_path, $data );

		$uploaded_url = $upload_dir['url'] . '/' . $filename;

		$qrCodeImage = get_option('lazytask_free_qr_code', '');
		if($qrCodeImage) {
			update_option('lazytask_free_qr_code', $uploaded_url);
		}else{
			add_option('lazytask_free_qr_code', $uploaded_url);
		}
		return array(
			'status' => 200,
			'message' => 'QR Code generated successfully',
			'uploaded_url' => get_option('lazytask_free_qr_code'),
		);


	}

}