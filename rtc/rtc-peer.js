/**
 * RTCPeer : Simple wrapper to makes webrtc interactions easy, works for chrome and firefox.
 * 
 * How to setup : 
 * 
 *
 * var peer1 = new RTCPeer();//peer in the first machine
 * 
 *
 * peer1.createConnection(null,{streams : [stream], channels : ['default']});// null is for ice servers so the code will work on LAN.
 * 																			 //share streams and name the created channel.
 * 																			 //You can use callback function, it just waits for couple of seconds
 * 																			 //so the ice candidates will be set
 * 
 * Now you have the connection descriptor : 
 * var connectionDescriptor1 = peer1.connectionDescriptor();// Now you should send this json object to the second machine
 * 							  							    // which has peer2 object.
 * 
 * var peer2 = new RTCPeer();//peer in the second machine.
 * peer2.connect(connectionDescriptor1);//Connects using descriptor.
 * 										//Wait for couple of seconds,
 * 										//or use a callback function
 * 
 * var connectionDescriptor2 = peer2.connectionDescriptor();// Now you should send this json object to the first machine.
 * 	 
 * peer1.connect(connectionDescriptor2);
 * 
 * All done!
 * 
 * Get shared streams :
 * peer2.getPeerConnection().getRemoteStreams();
 * 
 * Exchange data via channels :
 * peer.connectionChannels();//now you can use send, onmessage handler to exchange messages
 * 
 */
(function(){

	var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
	
	var RTCPeer = function(){
		var _self = this;
		var peerConnection;	
		var localDescriptor = { candidates : [],description : null};
		var dataChannels = [];

		this.connectionDescriptor = function(){
			return localDescriptor;
		}		
		
		this.connectionChannels = function(){
			return dataChannels;
		}
		
		this.getPeerConnection = function(){
			return peerConnection;
		}

		this.createConnection = function(){
			
			var servers,config,callback;
			
			if (arguments.length == 1){
				typeof arguments[0] == 'function'?(callback = arguments[0]) : (servers = arguments[0]);
			}else if(arguments.length == 2){
				servers = arguments[0];
				typeof arguments[1] == 'function'?(callback = arguments[1]) : (config = arguments[1]);
			}else if (arguments.length >=3 ){
				servers = arguments[0];
				config = arguments[1];
				callback = arguments[2];
			}
			
			servers = servers || null;
			config = config || {channels : ['default']};
			
			localDescriptor.servers = servers;
			
			console.log('Creating connection setup');

			 peerConnection =  new RTCPeerConnection(servers);
	  			 		  
			 this._setRemoteHandlers();
			
			  if(config && config!=null){
				  if(config.streams){
					  for(var i=0;i<config.streams.length;i++){
						  peerConnection.addStream(config.streams[i]);
					  }
				  }
				  
				   if(config.channels){
					   for(var i=0;i<config.channels.length;i++){
						 dataChannels.push(_self._createDataChannel(config.channels[i]));
					  }
				   }				
			  }
			  
			  peerConnection.createOffer(function(description){
				  peerConnection.setLocalDescription(description);
				  console.log('Offer from localPeerConnection: \n');
				  console.log(description);			  
				  localDescriptor.description = description;
				  
				  setTimeout(function(){
					   typeof callback == 'function' && callback(localDescriptor);
				  },2000);
			  },this._onerror);
		}
	
		this.connect = function(connectionDescriptor,callback){
			
			if(!connectionDescriptor){
				throw new Error('connectionDescriptor is required');
			}
			
			if(peerConnection && peerConnection != null){				
				this._addRemoteConnection(connectionDescriptor);
				console.log('connection is established');				
				typeof callback == 'function' && callback('connected');				
			}else{
				peerConnection = new RTCPeerConnection(connectionDescriptor.servers); 
				this._setRemoteHandlers();			
				console.log('Connecting using peer connection...');	
				this._addRemoteConnection(connectionDescriptor);
				
				peerConnection.createAnswer(function(description){
					peerConnection.setLocalDescription(description);
					console.log('Answer from remotePeerConnection: \n');
					console.log(description);
					localDescriptor.description = description;
					setTimeout(function(){
					   typeof callback == 'function' && callback(localDescriptor);
					},2000)
				},this._onerror);				  
			}
		}
		
		this.close = function(){
			
			localDescriptor = { candidates : [],description : null, servers : null};
		
			try{
				for(var i=0;i<dataChannels.length;i++){
					dataChannels[i].close();
				}
				peerConnection.close();
			}catch(err){
				this._onerror(err);
			}
			
			dataChannels = [];
			peerConnection = null;
			
		}
		
	}
	
	RTCPeer.prototype = {
		
		_setRemoteHandlers : function(){
			
			var peerConnection = this.getPeerConnection();
			var dataChannels = this.connectionChannels();
			
			var _self = this;
			peerConnection.onaddstream = function(e){
				typeof _self.onremotestream == 'function' && _self.onremotestream(e.stream);
			};			  
			
			peerConnection.ondatachannel = function(event){				
				if(event.channel && event.channel!=null ){
					dataChannels.push(event.channel);
					typeof _self.onremotechannel == 'function' && _self.onremotechannel(event.channel);
				}
			}	
			
		    peerConnection.onicecandidate = function(event){			
			   if(event.candidate && event.candidate!=null ){
					_self.connectionDescriptor().candidates.push(new RTCIceCandidate(event.candidate))
			   }
		    }
		},
		_addRemoteConnection : function(connectionDescriptor){
			
			var peerConnection = this.getPeerConnection();
			
			var connectionDescription = connectionDescriptor.description;
			var connectionCandidates = connectionDescriptor.candidates;
			
			peerConnection.setRemoteDescription(connectionDescription.toJSON?connectionDescription:new RTCSessionDescription(connectionDescription));
			
			for(var i=0;i<connectionCandidates.length;i++){	 
			   peerConnection.addIceCandidate(connectionCandidates[i].toJSON?connectionCandidates[i]:new RTCIceCandidate(connectionCandidates[i]));
			}
	
		},
		_createDataChannel :  function(channelName,options){
			options = options || {
				ordered: false, //no guaranteed delivery, unreliable but faster
				maxRetransmitTime: 1000, //milliseconds
				//negotiated  : true
			}
			
			var dataChannel = this.getPeerConnection().createDataChannel(channelName, options);	    
		   
			dataChannel.onopen = function(e){
				console.log('channel '+channelName +' is opened');
		   }
		   
		   return dataChannel;
		},
		
		_onerror : function(err){
			console.log(err)
		},
		
		onremotestream : function(stream){
			console.log('New stream');
			console.log(stream)
		},
		
		onremotechannel : function(channel){
			console.log('new data channel');
			console.log(channel)
		}
		
	}	
	
	window.RTCPeer = RTCPeer;

})();
