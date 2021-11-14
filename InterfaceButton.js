// A button on the interface.
// This is not going to be in the final version, just needed some buttons for testing and didn't want to integrate React.
// This was ripped from Alrecenk's Space Game : http://alrecenk.org/games/SpaceGame/SpaceGameC5.html
class InterfaceButton{

    constructor(x_i, y_i, width_i, height_i, text_i, text_size_i, text_color_i, back_color_i, edge_color_i, edge_size_i, my_function_i){
        this.x = x_i;
        this.y = y_i;
        this.width = width_i;
        this.height = height_i;
        this.text = text_i;
        this.text_size = text_size_i;
        this.text_color = text_color_i;
        this.back_color = back_color_i;
        this.edge_color = edge_color_i;
        this.my_function = my_function_i;
        this.edge_size = edge_size_i;
        this.rounded = Math.min(.2*this.width,.2*this.height);
    }
    
    // Draw the button on the given 2D context [ ui_canvas.getContext("2d") ]
    draw(context){
        InterfaceButton.drawRoundedRect(context, this.x, this.y, this.width, this.height, this.rounded, this.back_color, this.edge_color, this.edge_size);
        InterfaceButton.drawText(context, this.text, this.text_size, this.text_color, this.x+this.rounded, this.y+this.rounded, this.width-this.rounded*2);
    }
    
    // Returns is a position is inside the button.
    inside(m_x, m_y){
        return m_x >= this.x && m_x <= this.x + this.width && m_y >= this.y && m_y <= this.y + this.height;
    }
    
    execute(){
        if(this.my_function != null){
            this.my_function();
        }
    }

    static rgbArrayToHex(rgb) {
	    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
	}

    static rgbToHex(r, g, b) {
	    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}

    static hexToRgb(hex) {
	    var bigint = parseInt(hex.substring(1,7), 16);
	    var r = (bigint >> 16) & 255;
	    var g = (bigint >> 8) & 255;
	    var b = bigint & 255;
	    return [r,g,b];
	}


    //Draw a rounded rectangle on the canvas with a single call.
	//Use null for fill or stroke color if you do not wish to draw that element.
	static drawRoundedRect(context, x, y, width, height, radius, fill_color, stroke_color, stroke_size){
		if (width< 2 * radius) radius = width / 2;
		if (height < 2 * radius) radius = height / 2;
		context.beginPath();
		context.moveTo(x+radius, y);
		context.arcTo(x+width, y,   x+width, y+height, radius);
		context.arcTo(x+width, y+height, x,   y+height, radius);
		context.arcTo(x,   y+height, x,   y,   radius);
		context.arcTo(x,   y,   x+width, y,   radius);
		context.closePath();
		if(fill_color != null){
			context.fillStyle = fill_color;
			context.fill();
		}
		if(stroke_color != null){
			context.lineWidth = stroke_size;
			context.strokeStyle = stroke_color;
			context.stroke();
		}
	}
	
	// Draws horizontally centered text on a canvas context that wraps at word boundaries when it exceeds the given width.
	static drawText(context, text, size, color, x, y, width){
		context.font = size + "px Arial";
		context.fillStyle = color;
		var words = text.split(" "); 
		y+=size;
		var line = words[0] + " ";
		for(var w = 1; w < words.length; w++){
			if(context.measureText(line + words[w]).width > width){ // If next word doesn't fit.
				var line_width = context.measureText(line).width;
				context.fillText(line, x + (width-line_width)*.5, y);
				y+=size;
				line = words[w] + " ";
			}else{ // If word does fit.
				line += words[w] + " ";
			}
		}
		var line_width = context.measureText(line).width;
		context.fillText(line, x + (width-line_width)*.5, y);
	}

}	