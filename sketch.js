let dpi = 300;
let w = 11.7 * dpi;
let h = 8.3 * dpi;
let balls = [];
const k = 5; // Number of neighbors to consider
const G = 0.3; // Gravitational constant
let maxIterations = 2000;

let meetingPoint;
let specialBallsIndices;


class Ball {
	constructor(x, y) {
		this.pos = createVector(x, y);
		this.vel = createVector(random(1, 2), random(1, 2));
		// randomly set the direction of the velocity
		if (random() < 0.5) {
			this.vel.x *= -1;
		}
		if (random() < 0.5) {
			this.vel.y *= -1;
		}
		this.acc = createVector(0, 0);
		this.mass = random(0.5, 2);
		this.mass_lims = [0, 3];
		let options = [
			"#44AF69",
			"#F8333C",
			"#FCAB10",
			"#2B9EB3",
			[68, 175, 105, 90],
			[248, 51, 60, 90],
			[252, 171, 16, 90],
			[43, 158, 179, 90],
			// [68, 175, 105],
			// [252, 171, 16],
			// [219, 213, 181]
		]
		this.color = color(options[Math.floor(random(options.length))]);
	}

	update() {
		this.vel.add(this.acc);
		// this.vel.limit(5); // Limit maximum speed
		this.pos.add(this.vel);
		this.acc.mult(0);

		// Slowly vary mass
		this.mass += random(-0.1, 0.1);
		this.mass = constrain(this.mass, this.mass_lims[0], this.mass_lims[1]);

		// Bounce off walls
		if (this.pos.x <= 0 || this.pos.x >= w) {
			this.vel.x *= -1;
			this.pos.x = constrain(this.pos.x, 0, w);
		}
		if (this.pos.y <= 0 || this.pos.y >= h) {
			this.vel.y *= -1; 
			this.pos.y = constrain(this.pos.y, 0, h);
		}
	}

	applyForce(force) {
		let f = force.copy();
		f.div(this.mass);
		this.acc.add(f);
	}

	attract(other) {
		let force = p5.Vector.sub(this.pos, other.pos);
		let distance = force.mag();
		distance = constrain(distance, 5, 25);
		let strength = (G * this.mass * other.mass) / (distance * distance);
		force.setMag(strength);
		return force;
	}
}

function setup() {
	createCanvas(w, h);
	background("#dbd5b5");

	// Create balls
	for (let i = 0; i < 50; i++) {
		balls.push(new Ball(random(w), random(h)));
	}

	// Two balls will meet at a specific point
	meetingPoint = new Ball(w * 3 / 4, h / 2);
	specialBallsIndices = [0, 1];
	// set special properties for the special balls
	balls[specialBallsIndices[0]].mass = 3;
	balls[specialBallsIndices[0]].mass_lims = [2, 5];
	balls[specialBallsIndices[0]].pos = createVector(0, h/8);
	balls[specialBallsIndices[0]].vel = createVector(3, 5);
	balls[specialBallsIndices[0]].color = color(0);
	balls[specialBallsIndices[1]].mass = 3;
	balls[specialBallsIndices[1]].mass_lims = [2, 5];
	balls[specialBallsIndices[1]].pos = createVector(w, h*7/8);
	balls[specialBallsIndices[1]].vel = createVector(-3, -5);
	balls[specialBallsIndices[1]].color = color(255);
}

function draw() {
	// on every 100th frame, save the current frame to this directory	
	if (frameCount % 100 === 0) {
		saveCanvas('image', 'png');
	}

	// Update physics
	for (let ball of balls) {
		// Find k nearest neighbors
		let neighbors = balls
			.map(other => ({ball: other, dist: p5.Vector.dist(ball.pos, other.pos)}))
			.filter(n => n.ball !== ball)
			.sort((a, b) => a.dist - b.dist)
			.slice(0, k);

		// Apply gravitational forces from neighbors
		for (let neighbor of neighbors) {
			let force = ball.attract(neighbor.ball);
			neighbor.ball.applyForce(force);
		}

		// Apply gravitational forces from special balls
		// Attract to meeting point
		for (let specialBallIndex of specialBallsIndices) {
			let force = meetingPoint.attract(balls[specialBallIndex]);
			force.mult(3);  // amplify
			balls[specialBallIndex].applyForce(force);
		}
		// Attract to each other
		let force1 = balls[specialBallsIndices[0]].attract(balls[specialBallsIndices[1]]);
		force1.mult(3);  // amplify attraction
		balls[specialBallsIndices[1]].applyForce(force1);
		let force2 = balls[specialBallsIndices[1]].attract(balls[specialBallsIndices[0]]);
		force2.mult(3);  // amplify attraction
		balls[specialBallsIndices[0]].applyForce(force2);

		ball.update();
	}

	// Draw balls
	noStroke();
	for (let ball of balls) {
		fill(ball.color);
		circle(ball.pos.x, ball.pos.y, ball.mass * 10);
	}

	// When the two special balls meet each other, stop
	let distance = p5.Vector.dist(balls[specialBallsIndices[0]].pos, balls[specialBallsIndices[1]].pos);
	console.log(distance);
	// if (distance < 20) {
	// 	noLoop();
	// 	saveCanvas('image', 'png');
	// }
}