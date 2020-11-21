import { Component, OnInit } from '@angular/core';
import { Point2D } from '../models/point';

@Component({
  selector: 'app-finger-draw',
  templateUrl: './finger-draw.page.html',
  styleUrls: ['./finger-draw.page.scss'],
})
export class FingerDrawPage implements OnInit {

  canvasRef :HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  drawing:boolean = false;
  // mousePos:Point2D = new Point2D(0,0);
  lastPos: Point2D;
  constructor() { }

  ngOnInit() {
    // this.lastPos = this.mousePos;
    this.canvasRef = <HTMLCanvasElement>document.getElementById('sig-canvas');
    this.ctx = this.canvasRef.getContext('2d');
    this.ctx.strokeStyle = "#222222";
    this.ctx.lineWidth = 2;
    this.loadCanvasMouseEvents();
    this.loadCanvasTouchEvents();
  }
  private getMousePos = (evt) => {
    const rect = this.canvasRef.getBoundingClientRect();

    //return new vector2d(evt.clientX - rect.left,evt.clientY - rect.top,-1,-1);
    return new Point2D(evt.clientX - rect.left, evt.clientY - rect.top);
  }
  private getTouchPos = (touchEvent:any) => {
    const rect = this.canvasRef.getBoundingClientRect();
		return {
			x: touchEvent.touches[0].clientX - rect.left,
			y: touchEvent.touches[0].clientY - rect.top
		};
  }
  private loadCanvasMouseEvents(): void {
    this.canvasRef.onmousemove = (evt) => {
      if(this.drawing) {
        const currPos = this.getMousePos(evt);
        this.ctx.moveTo(this.lastPos.x, this.lastPos.y);
			  this.ctx.lineTo(currPos.x, currPos.y);
			  this.ctx.stroke();
			  this.lastPos = this.getMousePos(evt);
      }
    }
    this.canvasRef.onmousedown = (evt) => {
      this.drawing = true;
      this.lastPos = this.getMousePos(evt);
      console.log("Current Pos => ", this.lastPos);
    }
    this.canvasRef.onmouseup = (evt) => {
      this.drawing = false;
    }
  }
  private loadCanvasTouchEvents(): void {
    this.canvasRef.ontouchmove = (evt) => {
      const touch = evt.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
     this.canvasRef.dispatchEvent(mouseEvent);
    }
    this.canvasRef.ontouchstart = (evt) => {
      //this.mousePos = this.getTouchPos(evt);
      const touch = evt.touches[0];
      
		var mouseEvent = new MouseEvent("mousedown", {
			clientX: touch.clientX,
			clientY: touch.clientY
		});
		this.canvasRef.dispatchEvent(mouseEvent);
    }
    this.canvasRef.ontouchend = (evt) => {
      const mouseEvent = new MouseEvent("mouseup", {});
      this.canvasRef.dispatchEvent(mouseEvent);
    }
  }

}
