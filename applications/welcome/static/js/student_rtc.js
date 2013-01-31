var remoteStream;
var local_video;
var remote_video;
var localStream;
var pc_map={};
var relate_keys_obj;
function initialize() {
    relate_keys_obj =  eval("(" + relate_keys + ')');
    local_video = document.getElementById("local_video");
    remote_video = document.getElementById("remote_video");
    doGetUserMedia();
    openSocket(class_name);
}
function doGetUserMedia() {
    // Call into getUserMedia via the polyfill (adapter.js).
    try {
      getUserMedia({'audio':true, 'video':true}, onUserMediaSuccess,
                   onUserMediaError);
    } catch (e) {
      alert("getUserMedia() failed. Is this a WebRTC capable browser?");
      console.log("getUserMedia failed with exception: " + e.message);
    }
}
function openSocket(class_name){
	web2py_websocket('ws://'+host_name +':8888/realtime/'+class_name,onReceiveMsg,onOpen,onClose);
}
function onReceiveMsg(msg){
	try{
        var msg = JSON.parse(msg.data);
        if (msg.dest_key === access_token){
            if(msg.type ==='connect'){
                var pc=	createConnection();
                pc.onicecandidate = function (event){
  					if (event.candidate) {
    					sendMsg({dest_key:msg.access_token,
                   				access_token: access_token,
                   				type: 'candidate',
                   				label: event.candidate.sdpMLineIndex,
                   			    id: event.candidate.sdpMid,
                   				candidate: event.candidate.candidate});
  					}
				};
                pc.addStream(localStream);
                pc.createOffer(function (desc) {
    				pc.setLocalDescription(desc);
    				desc.access_token = access_token;
    				desc.dest_key = msg.access_token;
    				sendMsg(desc)
				});
                pc_map[msg.access_token] = pc;
            }
            else if (pc_map[msg.access_token]!= null) {
                var pc = pc_map[msg.access_token];
                if(msg.type ==='offer'){
                	pc.setRemoteDescription(new RTCSessionDescription(msg));
          			pc.createAnswer(function (desc) {
    					pc.setLocalDescription(desc);
    					desc.access_token = access_token;
    					desc.dest_key = msg.access_token;
    					sendMsg(desc)
					});
                }
                if (msg.type === 'answer') {
                  pc.setRemoteDescription(new RTCSessionDescription(msg));
                } else if (msg.type === 'candidate') {
                  var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
                                                       candidate:msg.candidate});
                  pc.addIceCandidate(candidate);
                }
            }
        }
    }catch(err){
      console.log(err)
    }
}
function createConnection(){
	var currentPC ;
 	try {
      var pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
      var pc_constraints = {"optional": []};
      // Create an RTCPeerConnection via the polyfill (adapter.js).
      currentPC = new RTCPeerConnection(pc_config, pc_constraints);
      currentPC.onaddstream = addStreamCallback;
    } catch (e) { 
        console.log("Failed to create PeerConnection, exception: " + e.message);
    }
    return currentPC;
}
function onOpen(){
	fireConnectRequest()
}
function onClose(){
}
function fireConnectRequest(){
	for(var i = 0 ; i<relate_keys_obj.length;i++){
		var pc=	createConnection();
        pc.dest_key= relate_keys_obj[i]
        pc.onicecandidate = function (event){
  			if (event.candidate) {
    			sendMsg({dest_key:this.dest_key,
                   		access_token: access_token,
                   		type: 'candidate',
                   		label: event.candidate.sdpMLineIndex,
                   		id: event.candidate.sdpMid,
                   		candidate: event.candidate.candidate});
  				}
		};
		pc_map[relate_keys_obj[i]] = pc;
		sendMsg({type:'connect',dest_key:relate_keys_obj[i],access_token:access_token});
	}
}
function onUserMediaSuccess(stream) {
    console.log("User has granted access to local media.");
    // Call the polyfill wrapper to attach the media stream to this element.
    attachMediaStream(local_video, stream);
    local_video.style.opacity = 1;
    localStream = stream;
}
function onUserMediaError(error) {
    console.log("Failed to get access to local media. Error code was " + error.code);
    alert("Failed to get access to local media. Error code was " + error.code + ".");
}

function sendMsg(msg){
    msg = JSON.stringify(msg)
    $.ajax({
        url: "/welcome/webrtc/connect/"+class_name,
        method:"POST",
        data: { "msg":msg}
   }).done(function ( data ) {
   });
}
function addStreamCallback(e){
	attachMediaStream(remote_video, e.stream);
	remoteStream = e.stream
}

setTimeout(initialize, 1);
