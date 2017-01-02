Some common utility may needed in the web developnment.

<p>
<h1> ArrayBufferStream</h1> : 
<p>With array buffer stream you can create a stream of array buffer with usinged bytes used for buffering operations.</p>
<p>var stream = new ArrayBufferStream(5*1000);//creates a stream of size ~5kb</p>
<p>stream.append(arraybuffer);//append the arraybuffer data to buffer</p>
<p>stream.append(['a','b','c']);//append the unsigned bytes to buffer</p>
<p>stream.append(blob);//append the blob data to buffer</p>
<p>stream.available();//the amount of bytes avaialble to read</p>
<p>stream.read(1000);//reads 1000bytes from the stream and returns them as an array buffer. </p>
</p>

<p>
<h1> RTCPeer</h1>
<p>Simple wrapper for RTCPeerConnection to make creation of RTC connection easy. </p>
</p>
