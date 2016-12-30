(function(){
	
	var ArrayBufferStream = function(capacity){
		
		if (this.constructor != ArrayBufferStream){
			throw new Error('ArrayBufferStream cannot be called as a function, use new operator')
		}
		
		capacity = capacity || Infinity;
		
		var buffer = [];
		var _self = this;

		this.clone = function(){
			var clonedObj = new ArrayBufferStream();
			
			var arraybuffer = new ArrayBuffer(buffer.length);
			var array = new Uint8Array(arraybuffer);
					
			for(var i=0;i<array.length;i++){
				array[i] = buffer[i];
			}
				
			clonedObj.append(array.buffer);
			
			return clonedObj;
				
		}
		this.capacity = function(){
			return capacity;
		}
		
		this.free = function(){
			return capacity - buffer.length;
		}
		
		this.full = function(){
			return buffer.length >= capacity;
		}
		
		this.clear = function(){
			this.almostFull = false;
			buffer.splice(0,buffer.length);
		}
		
		this.onupdate = undefined;
		this.almostFull = false;
		
		this.append = function(object){
				
			if(!object || object == null){
				return;
			}
				
			if(object instanceof ArrayBuffer){
				var arraybuffer = object;	
		
				if(arraybuffer.byteLength > this.free()){
					this.almostFull = true;
					throw new Error('append operation failed, cannot add new arraybuffer with size '
					+ arraybuffer.byteLength+', only '+this.free()+' bytes are free');
				}
				
				var array = new Uint8Array(arraybuffer);
				for(var i=0;i<array.length;i++){
					buffer.push(array[i]);
				}
				
				typeof this.onupdate == 'function' && this.onupdate();
			}else if(Array.isArray(object) && object && object!=null){
				var array = object;
				
				if(array.length > this.free()){
					this.almostFull = true;
					throw new Error('append operation failed, cannot add new array with size '
					+ array.length+', only '+this.free()+' bytes are free');
				}

				for(var i=0;i<array.length;i++){
					var item = array[i];
					
					var valid = false;
					if((Number.isInteger(item) && item <=255) ||(typeof item == 'string') && item.length == 1 && charCodeAt(0)<=255){
						valid = true;
					}
					
					if(!valid){
						throw new Error('Expected an array of unsigned bytes , invalid value '+JSON.stringify(item)+' at index '+i)
					}
				}
				
				
				for(var i=0;i<array.length;i++){
					var item = array[i];
					if(typeof item == 'string'){
						buffer.push(charCodeAt(0));
					}else{
						buffer.push(item);
					}
				}
				
				typeof this.onupdate == 'function' && this.onupdate();
			}else if (object instanceof Blob){
				var blob = object;
				var fd = new FileReader;
				fd.onloadend = function(e){
					_self.append(e.target.result);
				};		
				fd.readAsArrayBuffer(blob);
			}else{
				console.log('Object is not valid')
				console.log(object);
				throw new Error('Invalid type, expected ArrayBuffer,Blob or array of bytes')
			}
		}
		
		this.read = function(size){
			
			if(size<0){
				throw new Error('size cannot be negative value')
			}
				
			if(size > buffer.length){
				return;
			}else{
				var arraybuffer = new ArrayBuffer(size);
				var array = new Uint8Array(arraybuffer);
				
				subBuffer = buffer.splice(0,size);
				
				for(var i=0;i<array.length;i++){
					array[i] = subBuffer[i];
				}
				
				this.almostFull = false;
				return array.buffer;
			}
			
		}
		
		this.available = function(blockSize){
			if(blockSize){
				if(blockSize<0){
					throw new Error('Block size cannot be negative value');
				}
				return parseInt(buffer.length/blockSize)
			}else{
				return buffer.length;
			}
			
		}
	}
	
	window.ArrayBufferStream = ArrayBufferStream;
	
})();