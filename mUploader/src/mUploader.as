package
{
	import com.adobe.images.JPGEncoder;
	
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.Loader;
	import flash.display.LoaderInfo;
	import flash.display.Sprite;
	import flash.events.DataEvent;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.MouseEvent;
	import flash.external.ExternalInterface;
	import flash.geom.Matrix;
	import flash.geom.Rectangle;
	import flash.net.FileFilter;
	import flash.net.FileReference;
	import flash.net.URLRequest;
	import flash.net.URLRequestMethod;
	import flash.net.URLVariables;
	import flash.system.Security;
	import flash.utils.ByteArray;
	

	
	[SWF(width="265", height="50")]
	public class mUploader extends Sprite
	{
		private var url:String;
		private var filter:FileFilter;
		private var fr:FileReference;
		private var encoder:JPGEncoder;
		private var postData:Object;
		private var outputWidth:int = 138;
		private var uploadDataFieldName:String = "Filedata";
		private var btnLoader:Loader;
		private var button:Sprite;
		private var buttonBitmaps:Array;
		private var buttonWidth:int;
		private var buttonHeight:int;
		private var uploading:Boolean;
		private const SELECT:int = 0;
		private const UPLOADING:int = 1;
		private const CHANGE:int = 2;
		

		/**
		 * Simple class for upload support in older browsers.
		 * 
		 * @constructor
		 */
		public function mUploader()
		{
			encoder = new JPGEncoder(90);
			filter = new FileFilter("Images", "*.jpg;*jpeg;*.gif;*.png");
			postData = new Object();
			
		    resetFileReference();

			// Initialize ExternalInterface and allow communication with all domains.
			Security.allowDomain('*');
			Security.allowInsecureDomain('*');
			// Add listener to external interface that takes care about incoming messages
			ExternalInterface.addCallback("sendSwfMessage", receiveJsMessage);
		}
		
		private function resetFileReference():void {
			fr = new FileReference(); 
			fr.addEventListener(Event.SELECT, select);
			fr.addEventListener(Event.COMPLETE, complete);
			fr.addEventListener(DataEvent.UPLOAD_COMPLETE_DATA, uploadCompleteData);
			fr.addEventListener(IOErrorEvent.IO_ERROR, error);
		}
		
		private function loadBtn(event:Event):void {
			var target:LoaderInfo = (event.target as LoaderInfo); 
			var bitmap:Bitmap = (target.content as Bitmap);
			var W:int = buttonWidth;
			var H:int = buttonHeight;
			var rect:Rectangle = new Rectangle(0, 0, W, H);
			
			var matrix1:Matrix = new Matrix();
			matrix1.translate(0, -H);
			var matrix2:Matrix = new Matrix();
			matrix2.translate(0, -(2*H));
			
			var bitmapData1:BitmapData = new BitmapData(W, H);
			bitmapData1.draw(bitmap, null, null, null, rect);
			var bitmapData2:BitmapData = new BitmapData(W, H);
			bitmapData2.draw(bitmap, matrix1, null, null, rect);
			var bitmapData3:BitmapData = new BitmapData(W, H);
			bitmapData3.draw(bitmap, matrix2, null, null, rect);
			
			buttonBitmaps = [
				bitmapData1,
				bitmapData2,
				bitmapData3
			];
			
			button = new Sprite();
			button.x = 0;
			button.y = 0;
			
			changeButtonState(SELECT);
			
			button.buttonMode = true;
			button.addEventListener(MouseEvent.CLICK, onClick);
			addChild(button);	
		}
		
		private function changeButtonState(state:int):void {
			var data:BitmapData = buttonBitmaps[state];
			if (data) {
				button.graphics.beginBitmapFill(data, null, false, true);
			    button.graphics.drawRect(0, 0, buttonWidth, buttonHeight);
				button.graphics.endFill();
			}
			
		}
		
		/**
		 * Executes window.receiveSwfMessage with given arguments.
		 */
		private function sendJsMessage(name:String, msg:String = ''):void {
			ExternalInterface.call("receiveSwfMessage", name, msg);
		}
		
		/**
		 * Reacts on certain javascript messages.
		 */
		private function receiveJsMessage(name:String, msg:String):Boolean {
			trace('receive ' + name + ' ' + msg);
			try {
				var params:Object = JSON.parse(msg);
				if (name === 'config') {
					if ('url' in params) {
						url = params.url;
					}
					if ('postData' in params) {
						postData = params.postData
					}
					if ('filter' in params) {
						filter = new FileFilter(params.filter.name, params.filter.extension);
					}
					if ('outputImage') {
						encoder = new JPGEncoder(params.outputImage.quality);
						outputWidth = params.outputImage.width;
					}
					if ('uploadDataFieldName' in params) {
						uploadDataFieldName = params.uploadDataFieldName;
					}
					if ('button' in params) {
						btnLoader = new Loader();
						btnLoader.load(new URLRequest(params.button.url));
						btnLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, loadBtn);
						buttonWidth = params.button.width;
						buttonHeight = params.button.height;
					}
				}
			} catch (error:Error) {
				sendJsMessage('error_message', error.message);
				return false;
			}
			
			return true;
		}
		/**
		 * IO error hanlder.
		 */
		private function error(event:IOErrorEvent):void {
			sendJsMessage('error', 'IOErrorEvent');
		}
		/**
		 * On click listener just open file browsing window.
		 */
		private function onClick(event:MouseEvent):void {
			if (!uploading) {
				fr.browse([filter]);
			}
		}
		/**
		 * Selection listener.
		 * After user select file it upload it to server with given data. 
		 */
		private function select(event:Event):void 
		{ 			
			if (!url) {
				sendJsMessage('error', 'You need to set url first!');
				return;
			}
			
			uploading = true;
			
			var request:URLRequest = new URLRequest(); 
			request.url = url; 
			request.method = URLRequestMethod.POST;
			var variables:URLVariables = new URLVariables();
			for (var key:String in postData) {
				variables[key] = postData[key];
			}
			request.data = variables;
			
			fr.upload(request, uploadDataFieldName);
			changeButtonState(UPLOADING);
			
			sendJsMessage('upload');
		}
		/**
		 * Listener executed after loading ByteArray into loader.
		 * It performs scale operation on loaded image.
		 * 
		 */
		private function loaded(event:Event):void {
			var target:LoaderInfo = (event.target as LoaderInfo); 
			var bitmap:Bitmap = (target.content as Bitmap);
			var type:String = target.contentType;
			var dataURI:String = 'data:'+ type +';base64,';
			
			var orginalBData:BitmapData = new BitmapData(bitmap.width, bitmap.height);
			orginalBData.draw(bitmap, null, null, null, null, true); // apply only smoothing
			
			var orgWidth:int = bitmap.width;
			var dstWidth:int = this.outputWidth;
			var ratio:Number = dstWidth / orgWidth;
			var orgHeight:int = bitmap.height;
			var dstHeight:int = ratio * orgHeight;
			 
			var matrix: Matrix = new Matrix();   
			matrix.scale(ratio, ratio);
			
			var scaledBData:BitmapData = new BitmapData(dstWidth, dstHeight);
			scaledBData.draw(orginalBData, matrix, null, null, null, true); // apply only smoothing
			
			var data:ByteArray = encoder.encode(scaledBData);
			
			dataURI += Base64.encode(data);
  
			sendJsMessage('completeLoad', dataURI);
			resetFileReference();
		}
		
		/**
		 * Method forwards recived data to javascript.
		 * 
		 * @param {DataEvent} event Event containing data recieved from server.
		 */
		private function uploadCompleteData(event:DataEvent):void {
			sendJsMessage('data', event.data);		
		}
		
		/**
		 * Event listener fired in 2 cases:
		 * 1st file was uploaded to server
		 * 2nd file was loaded in to flash
		 * 
		 * in 1st it init loading image into flash
		 * in 2nd it loads given ByteArray into loader to scale it later
		 * 
		 * @param {Event} event
		 */
		private function complete(event:Event):void {
			var data:ByteArray = fr.data;
			if (data !== null) {
				changeButtonState(CHANGE);
				var loader:Loader = new Loader();
				loader.contentLoaderInfo.addEventListener(Event.COMPLETE, loaded);
				loader.loadBytes(fr.data);
			} else {
				uploading = false;
				sendJsMessage('completeUpload');
				fr.load();
			}
		}
	}
}