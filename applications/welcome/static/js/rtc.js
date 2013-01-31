navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;

var stream;
var local_video = document.getElementById("local_video");
var remote_video = document.getElementById("remote_video");
var localStream = null;
var pc1 = null;
var pc2 = null;
var pc3 = null;
function gotDescription(desc) {
    peerConn.setLocalDescription(desc);
    sendMsg(desc)
}
function sendMsg(msg){
    msg = JSON.stringify(msg)
    $.ajax({
        url: "/welcome/webrtc/connect",
        method:"POST",
        data: { "msg":msg}
   }).done(function ( data ) {
   });
}
function getConnection(){
   if (isCaller)
      peerConn.createOffer(gotDescription);
} 
function addStreamCallback(e){
	remote_video.src = webkitURL.createObjectURL(e.stream);
}
function createPeerConnection() {
    try {
      var pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
      var pc_constraints = {"optional": []};
      // Create an RTCPeerConnection via the polyfill (adapter.js).
      pc1 = new RTCPeerConnection(pc_config, pc_constraints);
      pc2 = new RTCPeerConnection(pc_config, pc_constraints);
      pc3 = new RTCPeerConnection(pc_config, pc_constraints);
    } catch (e) { 
        console.log("Failed to create PeerConnection, exception: " + e.message);
    }
    pc1.onicecandidate = iceCallback;
    pc1.onaddstream =  addStreamCallback;
    
    pc2.onicecandidate = iceCallback;
    pc2.onaddstream =  addStreamCallback;
    
    pc3.onicecandidate = iceCallback;
    pc3.onaddstream =  addStreamCallback;
}
web2py_websocket('ws://'+host_name +':8888/realtime/webrtc',function(e){
	try{
        alert('a')
        var msg = JSON.parse(e.data);
    
        if (msg.type === 'offer') {
          peerConn.setRemoteDescription(new RTCSessionDescription(msg));
          peerConn.createAnswer(gotDescription)
        } else if (msg.type === 'answer') {
          peerConn.setRemoteDescription(new RTCSessionDescription(msg));
        } else if (msg.type === 'candidate') {
          var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
                                               candidate:msg.candidate});
          peerConn.addIceCandidate(candidate);
        }
    }catch(err){
    }
	});
getUserMedia({audio: true, video: true}, function(localMediaStream) {
  local_video = document.getElementById("local_video");
  remote_video = document.getElementById("remote_video");
  try {
    localStream = localMediaStream
    local_video.src = webkitURL.createObjectURL(localStream);
  } catch(e) {
    try {
      local_video.mozSrcObject = localMediaStream;
      local_video.play();
    } catch(e){
      console.log("Error setting video src: ", e);
    }
  }
  createPeerConnection()
  peerConn.addStream(localStream);
}, function(error) {
  console.log("navigator.getUserMedia error: ", error);
});
function iceCallback(event){
  if (event.candidate) {
    sendMsg({type: 'candidate',
                   label: event.candidate.sdpMLineIndex,
                   id: event.candidate.sdpMid,
                   candidate: event.candidate.candidate});
  }
}
