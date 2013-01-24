package
{
	import flash.display.Loader;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.MouseEvent;
	import flash.external.ExternalInterface;
	import flash.net.FileReference;
	import flash.net.URLRequest;
	import flash.system.Security;
	import flash.utils.ByteArray;

	
	[SWF(width="300", height="200", bgcolor="#000000")]
	public class mUploader extends Sprite
	{
		private const UPLOAD_URL:String = "http://dyndns.pawlowski.it:8080/Workspace/roxy-girl/app/upload/upload.php"; 
		private var fr:FileReference;

		public function mUploader()
		{
			trace('mUploader');
			fr = new FileReference(); 
			fr.addEventListener(Event.SELECT, selectHandler); 
			// Currently progress event is not needed  
			// fr.addEventListener(ProgressEvent.PROGRESS, progressHandler); 
			fr.addEventListener(Event.COMPLETE, completeHandler);
			fr.addEventListener(IOErrorEvent.IO_ERROR, error);

			var button:Sprite = new Sprite();
			button.graphics.beginFill(0x00ff00);
			button.graphics.drawRect(0, 0, 120, 20);
			button.graphics.endFill();
			button.x = 10;
			button.y = 10;
			button.buttonMode = true;

			button.addEventListener(MouseEvent.CLICK, onClick);
			this.addChild(button);
			
			// Initialize ExternalInterface and allow communication with all domains.
			Security.allowDomain('*');
			Security.allowInsecureDomain('*');
			// Add listener to external interface that takes care about incoming messages
			ExternalInterface.addCallback("sendSwfMessage", receiveJsMessage);
			
		}
		
		private function sendJsMessage(name:String, msg:String):void {
			ExternalInterface.call("receiveSwfMessage", name, msg);
		}
		
		private function receiveJsMessage(name:String, msg:String):Boolean {
			trace('receive ' + name + ' ' + msg);
			return true;
		}
		
		private function error(event:IOErrorEvent):void {
			trace('Not such url!');
		}
		
		private function onClick(event:MouseEvent):void {
		  trace('click');
		  fr.browse();
		}
		
		private function selectHandler(event:Event):void 
		{ 
			trace("selectHandler: " + event);
		
			var request:URLRequest = new URLRequest(); 
			request.url = UPLOAD_URL; 
			fr.upload(request);
			
		}
		
		private function completeHandler(event:Event):void {
		    trace("complete");
			var data:ByteArray = fr.data;
			if (data !== null) {
				var ext:String = 'jpg';
				var dataURI:String = 'data:image/'+ ext +';base64,' + Base64.encode(fr.data);
				var s:Sprite = new Sprite();
				
				// 138px
				sendJsMessage('completeLoad', dataURI);
			} else {
				sendJsMessage('completeUpload', '');
				fr.load();
			}
		}
	}
}