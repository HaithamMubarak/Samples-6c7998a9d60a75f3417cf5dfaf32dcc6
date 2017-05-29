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
			  
			  peerConnection.createOffer().then(function(description){
				  peerConnection.setLocalDescription(description);
				  console.log('Offer from localPeerConnection: \n');
				  console.log(description);			  
				  localDescriptor.description = description;
				  
				  setTimeout(function(){
					   typeof callback == 'function' && callback(localDescriptor);
				  },2000);
			  });
		}
	
		this.connect = function(connectionDescriptor,callback){
			
			if(!connectionDescriptor){
				throw new Error('connectionDescriptor is required');
			}

			if(peerConnection && peerConnection != null){				
				var promises = this._addRemoteConnection(connectionDescriptor);				
				Promise.all(promises).then(function(){
					console.log('connection is established');				
					typeof callback == 'function' && callback('connected');	
				});
			}else{
				peerConnection = new RTCPeerConnection(connectionDescriptor.servers); 
				this._setRemoteHandlers();			
				console.log('Connecting using peer connection...');
				
				var promises = this._addRemoteConnection(connectionDescriptor);				
				promises.push(peerConnection.createAnswer());
				
				Promise.all(promises).then(function(){
					console.log('Answer from remotePeerConnection: \n');
					console.log(arguments[0])
					description = arguments[0][arguments[0].length -1];
					console.log(description);
					console.log('connection is established');
					peerConnection.setLocalDescription(description);
					
					
					localDescriptor.description = description;

					console.log('answer is created.');
					
					 setTimeout(function(){
						   typeof callback == 'function' && callback(localDescriptor);
					  },2000);

				});
						  
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
			    console.log(event);
			   if(event.candidate && event.candidate!=null ){
					_self.connectionDescriptor().candidates.push(new RTCIceCandidate(event.candidate))
			   }
		    }
		},
		_addRemoteConnection : function(connectionDescriptor){
			
			var peerConnection = this.getPeerConnection();
			
			var connectionDescription = connectionDescriptor.description;
			var connectionCandidates = connectionDescriptor.candidates;
			
			var promises = [];
			
			promises.push(peerConnection.setRemoteDescription(connectionDescription.toJSON?connectionDescription:new RTCSessionDescription(connectionDescription)));
			
			for(var i=0;i<connectionCandidates.length;i++){	 
			   promises.push(peerConnection.addIceCandidate(connectionCandidates[i].toJSON?connectionCandidates[i]:new RTCIceCandidate(connectionCandidates[i])));
			}
			
			return promises;
	
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
