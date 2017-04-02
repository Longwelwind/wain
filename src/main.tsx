///<reference path="../typings/easeljs.d.ts" />

import * as easeljs from "easeljs";
import {observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as cs from "react-classset";
import TooltipComponent from "./TooltipComponent";

class SpriteAtlas {
	readonly WAIN = new easeljs.SpriteSheet({
		images: [wainImage],
		frames: {
			width: 16,
			height: 16,
			regX: 8,
			regY: 8
		},
		animations: {
			"idle": [0, 3, "idle", 0.1]
		}
	});

	readonly FOREST = new easeljs.SpriteSheet({
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
	readonly ALCHEMY = new easeljs.SpriteSheet({
		images: [alchemyImage],
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
	readonly CITY = new easeljs.SpriteSheet({
		images: [cityImage],
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
	readonly COASTAL = new easeljs.SpriteSheet({
		images: [coastalImage],
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
	readonly SELECTED_CITY = new easeljs.SpriteSheet({
		images: [selectedCity],
		frames: {
			width: 64,
			height: 64,
			regX: 32,
			regY: 32
		},
		animations: {
			"idle": [0, 13, "idle", 0.1]
		}
	});
	readonly SELECTED_WAIN = new easeljs.SpriteSheet({
		images: [selectedWain],
		frames: {
			width: 48,
			height: 48,
			regX: 24,
			regY: 24
		},
		animations: {
			"idle": [0, 13, "idle", 0.1]
		}
	});
	readonly BOAT = new easeljs.SpriteSheet({
		images: [boatImage],
		frames: {
			width: 16,
			height: 16,
			regX: 8,
			regY: 8
		},
		animations: {
			"idle": [0, 6, "idle", 0.1]
		}
	});
}

class Game {
	readonly RADIUS_OFFSET = 40;

	@observable money: number = 1000;
	stage: easeljs.Stage;

	goodTypes: GoodType[];
	cityTypes: CityType[];
	cities: City[];
	links: CityLink[];
	transports: Transport[] = [];

	selectedCursor: easeljs.DisplayObject;
	@observable selectedCity: City;
	@observable selectedTransport: Transport;
	
	constructor() {
		let fish = new GoodType("Fish", "Produced in coastal villages, highly", "fish");
		let ingot = new GoodType("Ingot", "Produced in coastal villages, highly", "ingot");
		let wood = new GoodType("Wood", "Produced in coastal villages, highly", "wood");

		let caravan = new TransportType("Caravan", spriteAtlas.WAIN);
		let boat = new TransportType("Boat", spriteAtlas.BOAT);

		let coastal = new CityType("Coastal", [fish], [ingot], spriteAtlas.COASTAL);
		let mountain = new CityType("Mountain", [ingot], [fish], spriteAtlas.MOUNTAIN);
		let alchemy = new CityType("Alchemy", [ingot], [wood], spriteAtlas.ALCHEMY);
		let cityType = new CityType("City", [ingot], [fish], spriteAtlas.CITY);

		let city = new City("Del'Arrah", coastal, 280, 120);
		let secondCity = new City("Keltos", mountain, 240, 420);
		let thirdCity = new City("Kratop", alchemy, 420, 70);
		let fourth = new City("Telesee", cityType, 200, 260);

		this.goodTypes = [fish, ingot, wood];
		this.cityTypes = [coastal, mountain, alchemy, cityType];
		this.cities = [city, secondCity, thirdCity, fourth];
		this.links = [
			new CityLink(fourth, city, caravan),
			new CityLink(city, thirdCity, boat),
			new CityLink(secondCity, fourth, caravan)
		];
	}

	start() {
		this.stage.enableMouseOver();
		this.stage.snapToPixelEnabled = true;
		(this.stage.canvas as HTMLCanvasElement).getContext("2d").imageSmoothingEnabled = false;
		(this.stage.canvas as HTMLCanvasElement).getContext("2d").mozImageSmoothingEnabled = false;
		(this.stage.canvas as HTMLCanvasElement).getContext("2d").oImageSmoothingEnabled = false;
		(this.stage.canvas as HTMLCanvasElement).getContext("2d").webkitImageSmoothingEnabled = false;

		// We draw the world
		// Map behind
		let background = new easeljs.Bitmap(mapImage);
		background.scaleX = background.scaleY = 2;

		this.stage.addChild(background);
		// Cities
		this.cities.forEach((city) => {
			city.sprite = new easeljs.Sprite(city.type.spritesheet);
			city.sprite.cursor = "pointer";
			city.sprite.mouseEnabled = true;
			city.sprite.x = city.x;
			city.sprite.y = city.y;
			city.sprite.scaleX = city.sprite.scaleY = 2;
			city.sprite.gotoAndPlay("idle");

			city.sprite.addEventListener("click", () => {
				this.clearSelected();

				this.selectedCursor = new easeljs.Sprite(spriteAtlas.SELECTED_CITY, "idle");
				this.selectedCursor.x = city.x;
				this.selectedCursor.y = city.y;
				this.selectedCursor.scaleX = this.selectedCursor.scaleY = 2;
				this.stage.addChild(this.selectedCursor);

				this.selectedCity = city;
			});
			
			this.stage.addChild(city.sprite);
			this.stage.update();
		});

		// Drawing links
		this.links.forEach((link) => {
			link.shape = new easeljs.Shape();
			link.shape.snapToPixel = true;
			link.shape.x = link.shape.y = 0.5;
			let g = link.shape.graphics;

			let {x, y, x2, y2} = this.getOffsetLink(link);

			g.setStrokeStyle(1);
			g.beginStroke("black");
			g.beginFill("white");
			g.moveTo(x, y);
			g.lineTo(x2, y2);
			g.endFill();
			g.endStroke();

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
			x: Math.round(x1 + Math.cos(angle) * this.RADIUS_OFFSET),
			y: Math.round(y1 + Math.sin(angle) * this.RADIUS_OFFSET),
			x2: Math.round(x2 - Math.cos(angle) * this.RADIUS_OFFSET),
			y2: Math.round(y2 - Math.sin(angle) * this.RADIUS_OFFSET),
		};
	}

	public buyTransport(city: City, link: CityLink) {
		if (link.other(city) == null) {
			throw new Error(city.name + " is not part of (" + link.firstCity.name + ", " + link.secondCity.name + ")");
		}

		let transport = new Transport(this, city, link);
		this.transports.push(transport);

		transport.sprite = new easeljs.Sprite(link.type.spritesheet, "idle");
		this.stage.addChild(transport.sprite);
		transport.sprite.cursor = "pointer";
		transport.sprite.scaleY = transport.sprite.scaleX = 2;

		transport.sprite.addEventListener("click", () => {
			this.clearSelected();

			this.selectedCursor = new easeljs.Sprite(spriteAtlas.SELECTED_WAIN, "idle");
			this.selectedCursor.x = city.x;
			this.selectedCursor.y = city.y;
			this.selectedCursor.scaleX = this.selectedCursor.scaleY = 2;
			this.stage.addChild(this.selectedCursor);
			
			this.selectedTransport = transport;
		});
	}

	clearSelected() {
		if (this.selectedCursor != null) {
			this.stage.removeChild(this.selectedCursor);
		}

		this.selectedCity = null;
		this.selectedTransport = null;
	}

	update(delta: number) {
		this.stage.update();

		this.transports.forEach((t) => t.update(delta));

		if (this.selectedTransport != null) {
			this.selectedCursor.x = this.selectedTransport.sprite.x;
			this.selectedCursor.y = this.selectedTransport.sprite.y;
		}
	}

	public neighbours(city: City): CityLink[] {
		return this.links.filter((l) => l.other(city) != null);
	}
}

class CityType {
	constructor(public name: string, public sellingGoods: GoodType[], public buyingGoods: GoodType[], public spritesheet: easeljs.SpriteSheet) {

	}
}

class City {
	public sprite: easeljs.Sprite;

	constructor(public name: string, public type: CityType, public x: number, public y: number) {
		
	}
}

class CityLink {
	public shape: easeljs.Shape;

	constructor(public firstCity: City, public secondCity: City, public type: TransportType) {

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

enum TransportAction {
	DROP,
	TAKE,
	SELL,
	BUY
}

class CityAction {
	static readonly TRANSPORT_ACTIONS = [
		TransportAction.BUY,
		TransportAction.SELL,
		TransportAction.DROP,
		TransportAction.TAKE
	];

	@observable action: TransportAction;

	public constructor(public good: GoodType, action: TransportAction) {
		this.action = action;
	}
}

class TransportType {
	public constructor(public name: string, public spritesheet: easeljs.SpriteSheet) {

	}
}

class Transport {
	readonly TIME_WAITING = 2;
	readonly SPEED = 50;
	readonly RADIUS_AROUND_CITY_MIN = 30;
	readonly RADIUS_AROUND_CITY_RANGE = 10;

	public waitingTimeRemaining: number;
	public sprite: easeljs.Sprite;
	public advancement: number;

	@observable firstCityActions: CityAction[] = [];
	@observable secondCityActions: CityAction[] = [];

	public offsetAroundCityX = 0;
	public offsetAroundCityY = 0;

	constructor(public game: Game, public location: City, public link: CityLink) {
		this.waitingTimeRemaining = 0.001;
	}

	update(delta: number) {
		if (this.waitingTimeRemaining > 0) {
			// Waiting in a city
			this.waitingTimeRemaining -= delta;

			if (this.waitingTimeRemaining < 0) {
				// We go on our way
				this.offsetAroundCityX = 0;
				this.advancement = 0;
			}
		} else {
			// Taking the road~
			this.advancement += delta * this.SPEED / this.link.distance();

			if (this.advancement > 1) {
				this.location = this.link.other(this.location);
				this.waitingTimeRemaining = this.TIME_WAITING;
			}

			// Making so that the transport faces the right direction
			if (this.location.x > this.link.other(this.location).x) {
				this.sprite.scaleX = -2;
			} else {
				this.sprite.scaleX = 2;
			}
		}

		let {x, y} = this.getCoord();
		this.sprite.x = x;
		this.sprite.y = y;
	}

	getCoord(): {x: number, y: number} {
		if (this.waitingTimeRemaining > 0) {
			// Waiting in a city
			if (this.offsetAroundCityX == 0) {
				let angle = Math.random() * 360;

				this.offsetAroundCityX = Math.sin(angle) * (this.RADIUS_AROUND_CITY_MIN + Math.random() * this.RADIUS_AROUND_CITY_RANGE);
				this.offsetAroundCityY = Math.cos(angle) * (this.RADIUS_AROUND_CITY_MIN + Math.random() * this.RADIUS_AROUND_CITY_RANGE);
			}

			return {
				x: this.location.x + this.offsetAroundCityX,
				y: this.location.y + this.offsetAroundCityY
			};
		} else {
			// Taking the road~
			let {x, y, x2, y2} = this.game.getOffsetLink(this.link);
			let targetX = x + (x2 - x) * (this.link.forward(this.location) ? this.advancement : 1 - this.advancement);
			let targetY = y + (y2 - y) * (this.link.forward(this.location) ? this.advancement : 1 - this.advancement);

			targetX = Math.round(targetX);
			targetY = Math.round(targetY);

			return {
				x: targetX,
				y: targetY
			}
		}
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
	text?: string;
	onClick?: () => void;
	pointerHover: boolean;
	addedTooltipText?: string;
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
				<div
					className={cs({
						"good-slot": true,
						"good-slot-hover": this.props.pointerHover
					})}
					style={{position: "relative"}}
					onClick={() => { if (this.props.onClick != null) this.props.onClick() }}
				>
					<img
						className="crispy"
						width="32px"
						src={"./assets/" + this.props.good.icon + ".png"} />
					{this.props.text != null && (
						<span style={{
							position: "absolute",
							left: 0,
							right: 0,
							marginLeft: 2,
							marginRight: 2,
							backgroundColor: "black",
							paddingRight: 2,
							paddingLeft: 2,
							fontSize: 10,
							top: 30,
							textAlign: "center"
						}}>
							{this.props.text}
						</span>
					)}
					
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
					width={500}
					height={500}
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
						Selling
						<div style={{display: "flex", flexWrap: "wrap"}}>
							{selectedCity.type.sellingGoods.map((good) => (
								<GoodComponent good={good} pointerHover={false}/>
							))}
						</div>
						<hr />
						Buying
						<div style={{display: "flex", flexWrap: "wrap"}}>
							{selectedCity.type.buyingGoods.map((good) => (
								<GoodComponent good={good} pointerHover={false}/>
							))}
						</div>
						<hr />
						{this.props.game.neighbours(selectedCity).map((link) => (
						<button style={{width: "100%"}} onClick={() => this.buyWain(link)}>
							Buy a {link.type.name} (to {link.other(selectedCity).name})
						</button>
						))}
						
					</div>
					)}
					{selectedTransport != null && (
					<div>
						<hr />
						{selectedTransport.link.firstCity.name}
						{this.displayListGoods(
							selectedTransport,
							this.getGoodsToDisplayFirstCity(),
							selectedTransport.firstCityActions
						)}
						<hr />
						{selectedTransport.link.secondCity.name}
						{this.displayListGoods(
							selectedTransport,
							this.getGoodsToDisplaySecondCity(),
							selectedTransport.secondCityActions
						)}
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

	private displayListGoods(transport: Transport, goods: GoodType[], actions: CityAction[]) {
		return (
			<div style={{display: "flex", flexWrap: "wrap"}}>
				{goods.map((good) => {
					let action = this.getAction(good, actions);
					return (
					<div>
						<GoodComponent
							good={good}
							onClick={() => { 
								this.toggleGoodCity(good, actions)
							}}
							text={action != null ? this.getActionText(action.action) : null}
							pointerHover={true}
						/>
					</div>
					)
				})}
			</div>
		);
	}

	private getGoodsToDisplayFirstCity(): GoodType[] {
		let link = this.props.game.selectedTransport.link;
		return this.getGoodsToDisplay(link, link.firstCity);
	}

	private getGoodsToDisplaySecondCity(): GoodType[] {
		let link = this.props.game.selectedTransport.link;
		return this.getGoodsToDisplay(link, link.secondCity);
	}

	private getAction(good: GoodType, actions: CityAction[]): CityAction {
		return actions.filter((a) => a.good == good)[0];
	}

	private getActionText(action: TransportAction): string {
		switch (action) {
			case (TransportAction.BUY):
				return "BUY";
			case (TransportAction.DROP):
				return "DROP";
			case (TransportAction.TAKE):
				return "TAKE";
			case (TransportAction.SELL):
				return "SELL";
			default:
				return "NONE";
		}
	}

	private toggleGoodCity(good: GoodType, actions: CityAction[]) {
		let action = this.getAction(good, actions);
		if (action == null) {
			action = new CityAction(good, CityAction.TRANSPORT_ACTIONS[0]);
			actions.push(action);
		} else {
			let i = CityAction.TRANSPORT_ACTIONS.indexOf(action.action) + 1;
			if (i == CityAction.TRANSPORT_ACTIONS.length) {
				actions.splice(actions.indexOf(action), 1);
			} else {
				action.action = CityAction.TRANSPORT_ACTIONS[i];
			}
			
		}
	}

	private getGoodsToDisplay(link: CityLink, city: City): GoodType[] {
		let goods = [];

		goods = goods.concat(city.type.sellingGoods);
		goods = goods.concat(city.type.buyingGoods);
		goods = goods.concat(link.other(city).type.sellingGoods);
		goods = goods.concat(link.other(city).type.buyingGoods);
		goods = goods.filter((g, i) => goods.indexOf(g) == i);

		return goods;
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

	private buyWain(link: CityLink) {
		this.props.game.buyTransport(this.props.game.selectedCity, link);
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
let boatImage = new Image();
boatImage.src = "assets/boat.png";
let mapImage = new Image();
mapImage.src = "assets/map.png";
let alchemyImage = new Image();
alchemyImage.src = "assets/alchemy.png";
let coastalImage = new Image();
coastalImage.src = "assets/coastal.png";
let cityImage = new Image();
cityImage.src = "assets/city.png";
let selectedCity = new Image();
selectedCity.src = "assets/selected-city.png";
let selectedWain = new Image();
selectedWain.src = "assets/selected-wain.png";

let spriteAtlas = new SpriteAtlas();

let game = new Game();
window["game"] = game;

ReactDOM.render(<GameApp game={game} />, document.getElementById("container"));

