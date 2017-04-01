///<reference path="../typings/easeljs.d.ts" />

import * as easeljs from "easeljs";
import {observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import TooltipComponent from "./TooltipComponent";

class SpriteAtlas {
	readonly WAIN = new easeljs.SpriteSheet({
		images: [wainImage],
		frames: {
			width: 16,
			height: 16,
			regX: 8,
			regY: 4
		},
		animations: {
			"idle": [0]
		}
	});

	readonly COASTAL = new easeljs.SpriteSheet({
		images: [forestImage],
		frames: {
			width: 32,
			height: 32,
			regX: 16,
			regY: 16
		},
		animations: {
			"idle": [0]
		}
	});
	readonly MOUNTAIN = new easeljs.SpriteSheet({
		images: [mountainImage],
		frames: {
			width: 32,
			height: 32,
			regX: 16,
			regY: 16
		},
		animations: {
			"idle": [0]
		}
	});
}

class Game {
	readonly RADIUS_OFFSET = 20;

	@observable money: number = 1000;
	stage: easeljs.Stage;

	goodTypes: GoodType[];
	cityTypes: CityType[];
	cities: City[];
	links: CityLink[];
	transports: Transport[] = [];

	@observable selectedCity: City;
	@observable selectedTransport: Transport;
	
	constructor() {
		let fish = new GoodType("Fish", "Produced in coastal villages, highly", "fish");
		let ingot = new GoodType("Ingot", "Produced in coastal villages, highly", "ingot");

		let coastal = new CityType("Coastal", [fish], spriteAtlas.COASTAL);
		let mountain = new CityType("Mountain", [ingot], spriteAtlas.MOUNTAIN);

		let city = new City("Del'Arrah", coastal, 100, 100);
		let secondCity = new City("Keltos", coastal, 180, 80);
		let thirdCity = new City("Kratop", mountain, 180, 150);

		this.goodTypes = [fish];
		this.cityTypes = [coastal, mountain];
		this.cities = [city, secondCity, thirdCity];
		this.links = [
			new CityLink(city, secondCity),
			new CityLink(secondCity, thirdCity)
		];
	}

	start() {
		this.stage.enableMouseOver();

		// We draw the world
		// Cities
		this.cities.forEach((city) => {
			city.sprite = new easeljs.Sprite(city.type.spritesheet);
			city.sprite.cursor = "pointer";
			city.sprite.x = city.x;
			city.sprite.y = city.y;
			city.sprite.gotoAndPlay("idle");

			city.sprite.addEventListener("click", () => {
				this.clearSelected();
				this.selectedCity = city;
			});
			
			this.stage.addChild(city.sprite);
			this.stage.update();
		});

		// Drawing links
		this.links.forEach((link) => {
			link.shape = new easeljs.Shape();
			link.shape.x = link.shape.y = 0.5;
			let g = link.shape.graphics;

			let {x, y, x2, y2} = this.getOffsetLink(link);

			g.setStrokeStyle(1);
			g.beginStroke("white");
			g.moveTo(x, y);

			g.lineTo(x2, y2);

			this.stage.addChild(link.shape);
		});
	}

	public getOffsetLink(link: CityLink): {x, y, x2, y2} {
		let x1 = link.firstCity.x;
		let x2 = link.secondCity.x;
		let y1 = link.firstCity.y;
		let y2 = link.secondCity.y;

		let angle = Math.atan2(y2 - y1, x2 - x1);

		return {
			x: x1 + Math.cos(angle) * this.RADIUS_OFFSET,
			y: y1 + Math.sin(angle) * this.RADIUS_OFFSET,
			x2: x2 - Math.cos(angle) * this.RADIUS_OFFSET,
			y2: y2 - Math.sin(angle) * this.RADIUS_OFFSET,
		};
	}

	public buyWain(city: City) {
		let tradeRoute = new TradeRoute();
		tradeRoute.addCity(city);
		tradeRoute.addCity(this.cities.filter((c) => c != city)[0]);
		let transport = new Transport(this, city, tradeRoute);
		this.transports.push(transport);

		transport.sprite = new easeljs.Sprite(spriteAtlas.WAIN);
		this.stage.addChild(transport.sprite);
		transport.sprite.cursor = "pointer";

		transport.sprite.addEventListener("click", () => {
			this.clearSelected();
			this.selectedTransport = transport;
		});
	}

	clearSelected() {
		this.selectedCity = null;
		this.selectedTransport = null;
	}

	update(delta: number) {
		this.stage.update();

		this.transports.forEach((t) => t.update(delta));
	}

	public neighbours(city: City): CityLink[] {
		return this.links.filter((l) => l.other(city) != null);
	}
}

class CityType {
	constructor(public name: string, public sellingGoods: GoodType[], public spritesheet: easeljs.SpriteSheet) {

	}
}

class City {
	public sprite: easeljs.Sprite;

	constructor(public name: string, public type: CityType, public x: number, public y: number) {
		
	}
}

class CityLink {
	public shape: easeljs.Shape;

	constructor(public firstCity: City, public secondCity: City) {

	}

	public distance(): number {
		return Math.sqrt(Math.pow(this.firstCity.x - this.secondCity.x, 2) + Math.pow(this.firstCity.y - this.secondCity.y, 2));
	}

	public other(city: City): City {
		return this.firstCity == city ? this.secondCity : (this.secondCity == city ? this.firstCity : null);
	}

	public forward(start: City): boolean {
		return this.firstCity == start;
	}
}

class GoodType {
	constructor(public name: string, public description: string, public icon: string) {

	}
}

class Transport {
	readonly SPEED = 50;
	readonly RADIUS_AROUND_CITY = 10;

	public sprite: easeljs.Sprite;
	public currentStep: Waypoint;
	public takenLink: CityLink;
	public advancement: number;

	public offsetAroundCityX = 0;
	public offsetAroundCityY = 0;

	constructor(public game: Game, public location: City, public tradeRoute: TradeRoute) {
		this.currentStep = tradeRoute.waypoints[0];
	}

	update(delta: number) {
		if (this.takenLink == null) {
			// Waiting in a city
			if (this.offsetAroundCityX == 0) {
				this.offsetAroundCityX = Math.random() * this.RADIUS_AROUND_CITY;
				this.offsetAroundCityY = Math.random() * this.RADIUS_AROUND_CITY;
			}

			this.sprite.x = this.location.x + this.offsetAroundCityX;
			this.sprite.y = this.location.y + this.offsetAroundCityY;

			// We try to find a next waypoint
			if (this.tradeRoute.waypoints.length > 1) {
				this.findNextWay();
			}
		} else {
			// Taking the road~
			let {x, y, x2, y2} = this.game.getOffsetLink(this.takenLink);
			this.sprite.x = x + (x2 - x) * this.takenLink.forward(this.location) ? this.advancement : ;

			this.advancement += delta * this.SPEED / this.takenLink.distance();

			if (this.advancement > 1) {
				this.location = this.takenLink.other(this.location);

				this.findNextWay();
			}
		}
	}

	private findNextWay() {
		this.currentStep = this.tradeRoute.nextWaypoint(this.currentStep);
		let neighbours = this.game.neighbours(this.location);
		let link = neighbours.filter((l) => l.other(this.location) == this.currentStep.city)[0];

		if (link == undefined) {
			throw new Error(this.location.name + " not neighbour of " + this.currentStep.city.name);
		}

		this.takenLink = link;
		this.advancement = 0;
	}

	onReachCity() {

	}
}

class TradeRoute {
	public waypoints: Waypoint[] = [];

	addCity(city: City) {
		this.waypoints.push(new Waypoint(city));
	}

	nextWaypoint(currentWaypoint: Waypoint): Waypoint {
		let i = this.waypoints.indexOf(currentWaypoint);
		if (i != -1) {
			return this.waypoints[(i + 1) % this.waypoints.length];
		} else {
			return this.waypoints[0];
		}
	}
}

class Waypoint {
	constructor(public city: City) {

	}
}

interface GameAppProps {
	game: Game;
}

interface GoodComponentProps {
	good: GoodType;
}

@observer
class GoodComponent extends React.Component<GoodComponentProps, null> {
	public render() {
		return (
			<TooltipComponent
				tooltip={(
					<div className="tooltip">
						<div style={{fontSize: 16}}>{this.props.good.name}</div>
						<div>{this.props.good.description}</div>
					</div>
				)}
			>
				<div className="good-slot">
					<img
						className="crispy"
						width="32px"
						src={"./assets/" + this.props.good.icon + ".png"} />
				</div>
			</TooltipComponent>
		);
	}
}

@observer
class GameApp extends React.Component<GameAppProps, null> {
	canvas: HTMLCanvasElement;
	then: number;

	public render() {
		let selectedCity = this.props.game.selectedCity;
		let selectedTransport = this.props.game.selectedTransport;
		return (
			<div style={{display: "flex"}}>
				<canvas
					className="crispy"
					ref={(c) => this.canvas = c}
					width={250}
					height={250}
					style={{
						width: 500, height: 500, border: "1px solid white", marginRight: 10
					}}
				>
				</canvas>
				<div style={{width: 200}}>
					<div style={{fontSize: 16}}>
						{this.props.game.money} gold

					</div>
					<hr />
					{selectedCity != null && (
					<div>
						<div className="city-title">{selectedCity.name}</div>
						<div className="city-type">{selectedCity.type.name}</div>
						<hr />
						<div style={{display: "flex", flexWrap: "wrap"}}>
							{selectedCity.type.sellingGoods.map((good) => (
								<GoodComponent good={good}/>
							))}
						</div>
						<hr />
						<button style={{width: "100%"}} onClick={() => this.buyWain()}>
							Buy a wain
						</button>
					</div>
					)}
					{selectedTransport != null && (
					<div>
						<hr />

						<hr />
						<button style={{width: "100%"}}>
							Sell wain
						</button>
					</div>
					)}
				</div>
			</div>
		);
	}

	private update(delta: number) {
		this.props.game.update(delta);
	}

	private updateLoop() {
		this.then = Date.now();

		requestAnimationFrame(() => {
			let delta = Date.now() - this.then;
			this.updateLoop();
			this.update(delta / 1000);
		});
	}

	private buyWain() {
		this.props.game.buyWain(this.props.game.selectedCity);
	}

	componentDidMount() {
		let stage = new easeljs.Stage(this.canvas);
		game.stage = stage;

		this.updateLoop();

		game.start();
	}
}

let mountainImage = new Image();
mountainImage.src = "assets/mountain.png";
let forestImage = new Image();
forestImage.src = "assets/forest.png";
let wainImage = new Image();
wainImage.src = "assets/wain.png";

let spriteAtlas = new SpriteAtlas();

let game = new Game();
window["game"] = game;

ReactDOM.render(<GameApp game={game} />, document.getElementById("container"));

