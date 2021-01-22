const Fireworks = function (canvasRef, contextRef) {
  
    const max_fireworks = 5;
    const max_sparks = 50;
    let fireworks = [];
    let requestId = undefined;

    this.setUpFireWorks = () => {
        for (let i = 0; i < max_fireworks; i++) {
            let firework = {
              sparks: []
            };
            for (let n = 0; n < max_sparks; n++) {
              let spark = {
                vx: Math.random() * 5 + .5,
                vy: Math.random() * 5 + .5,
                weight: Math.random() * .3 + .03,
                red: Math.floor(Math.random() * 2),
                green: Math.floor(Math.random() * 2),
                blue: Math.floor(Math.random() * 2)
              };
              if (Math.random() > .5) spark.vx = -spark.vx;
              if (Math.random() > .5) spark.vy = -spark.vy;
              firework.sparks.push(spark);
            }
            fireworks.push(firework);
            this.resetFirework(firework);
          }
    }
    this.explode = () => {
        contextRef.clearRect(0, 0, canvasRef.width, canvasRef.height);
        fireworks.forEach((firework,index) => {
          if (firework.phase == 'explode') {
              firework.sparks.forEach((spark) => {
              for (let i = 0; i < 10; i++) {
                let trailAge = firework.age + i;
                let x = firework.x + spark.vx * trailAge;
                let y = firework.y + spark.vy * trailAge + spark.weight * trailAge * spark.weight * trailAge;
                let fade = i * 20 - firework.age * 2;
                let r = Math.floor(spark.red * fade);
                let g = Math.floor(spark.green * fade);
                let b = Math.floor(spark.blue * fade);
                contextRef.beginPath();
                contextRef.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',1)';
                contextRef.rect(x, y, 4, 4);
                contextRef.fill();
              }
            });
            firework.age++;
            if (firework.age > 100 && Math.random() < .05) {
              this.resetFirework(firework);
            }
          } else {
            firework.y = firework.y - 10;
            for (let spark = 0; spark < 15; spark++) {
              contextRef.beginPath();
              contextRef.fillStyle = 'rgba(' + index * 50 + ',' + spark * 17 + ',0,1)';
              contextRef.rect(firework.x + Math.random() * spark - spark / 2, firework.y + spark * 4, 4, 4);
              contextRef.fill();
            }
            if (Math.random() < .001 || firework.y < 200) firework.phase = 'explode';
          }
        });
       requestId = window.requestAnimationFrame(this.explode);
      }
    this.resetFirework = (firework) => {
        firework.x = Math.floor(Math.random() * canvasRef.width);
        firework.y = canvasRef.height;
        firework.age = 0;
        firework.phase = 'fly';
      }
    this.getAsWebElement =  () => {
        this.setUpFireWorks();
        if(!requestId) {
            requestId = window.requestAnimationFrame(this.explode);
        }
       
        // contextRef.fillRect(300, 300, 50, 50);
    };
    this.cancelAnimation = () => {
        if(requestId) {

            window.cancelAnimationFrame(requestId);
            // console.log('Cancelled id => ', requestId)
            requestId = undefined;
        }
    }

}
module.exports = Fireworks;