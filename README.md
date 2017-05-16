<h1> ArrayBufferStream</h1>
<p>With array buffer stream you can create a stream of array buffer with usinged bytes used for buffering operations.</p>

```javascript

var stream = new ArrayBufferStream(5*1000);//creates a stream of size ~5kb

stream.append(arraybuffer);   //append the arraybuffer data to stream

stream.append(['a','b','c']); //append the unsigned bytes to stream

stream.append(blob);          //append the blob data to stream

stream.available();           //the amount of bytes avaialble to read in the stream

stream.read(1000);            //reads 1000bytes from the stream and returns them as an array buffer. 
                              //if the buffer has less available bytes it will returns the result as undefined 
```


<h1> RTCPeer</h1>
<p>Simple wrapper for RTCPeerConnection to make creation of RTC connection easy. </p>
<p>Suppose you have to peer machines where peer1 is running on first machine and peer2 is running on machine2, you can the following steps to create RTC Connection between these two peers :  </p>

<p>RTCPeer Creation (three steps) : </p>

<p>1- Connection initialization</p>

```javascript
var peer1 = new RTCPeer();
peer1.createConnection(null,{	//null is for ice servers so the code will work on LAN.
streams : [stream],	 //share streams.
channels : ['default'] //crate data channels.	
},callback); 
//after connection creation you should wait for couple
//of seconds so the ice candiates will be created, or you
//use optional callback function as thrid parameter.				
                                                                           

var connectionDescriptor1 = peer1.connectionDescriptor();// Now you should send this json object to the second machine, so the 
                                                         // second peer will use this connection

```

<p>2- Use the first peer conenction descriptor</p>

```javascript
  var peer2 = new RTCPeer();  
  peer2.connect(connectionDescriptor1,callback);//Connects using descriptor, and creates its own connection descriptor.
				       //Wait for couple of seconds,or use optional callback function.
                                        
  var connectionDescriptor2 = peer2.connectionDescriptor();// Now you should send this json object to the first machine.
```

<p>3- Use the second peer conenction descriptor</p>

```javascript
peer1.connect(connectionDescriptor2);
```

<p>All done!</p>


