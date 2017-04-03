///<reference path="../typings/easeljs.d.ts" />

import * as easeljs from "easeljs";
import {observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as cs from "react-classset";
import TooltipComponent from "./TooltipComponent";

import City from "./City";

const DEBUG = true;

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
			"idle": {
				frames: [0],
				speed: 0.1
			},
			"travel": {
				frames: [0, 1, 2, 3],
				speed: 0.1
			}
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
			"idle": {
				frames: [0],
				speed: 0.1
			},
			"travel": {
				frames: [0, 1, 2, 3, 4, 5,6],
				speed: 0.1
			}
		}
	});
}

export class Game {
	readonly RADIUS_OFFSET = 40;

	@observable money: number = 1000;
	stage: easeljs.Stage;

	goodTypes: GoodType[];
	cityTypes: CityType[];
	buildingTypes: BuildingType[];
	cities: City[];
	links: CityLink[];
	@observable transports: Transport[] = [];
	timeElapsed: number;

	selectedCursor: easeljs.DisplayObject;
	@observable selectedCity: City;
	@observable selectedTransport: Transport;
	
	constructor() {
		let fish = new GoodType("Fish", "Produced in coastal villages, highly", "fish");
		let ingot = new GoodType("Ingot", "Produced in coastal villages, highly", "ingot");
		let wood = new GoodType("Wood", "Produced in coastal villages, highly", "wood");
		let herbs = new GoodType("Herbs", "I really need to find a good description for this item", "herbs");
		let potion = new GoodType("Potion", "Produced in coastal villages, highly", "potion");
		let sword = new GoodType("Sword", "Produced in coastal villages, highly", "sword");

		let caravan = new TransportType("Caravan", spriteAtlas.WAIN);
		let boat = new TransportType("Boat", spriteAtlas.BOAT);

		let coastal = new CityType("Coastal", [
			new GoodOffer(fish, 40)
		], [
			new GoodOffer(ingot, 20)
		], spriteAtlas.COASTAL);
		let mountain = new CityType("Mountain", [
			new GoodOffer(ingot, 40)
		], [
			new GoodOffer(fish, 30)
		], spriteAtlas.MOUNTAIN);
		let alchemy = new CityType("Alchemy", [
			new GoodOffer(ingot, 10)
		], [
			new GoodOffer(wood, 5)
		], spriteAtlas.ALCHEMY);
		let cityType = new CityType("City", [
			new GoodOffer(ingot, 5)
		], [
			new GoodOffer(fish, 4)
		], spriteAtlas.CITY);

		let forge = new BuildingType("Forge", 100, [ingot], sword, 10);

		let city = new City(this, "Del'Arrah", coastal, 140*2, 60*2);
		let secondCity = new City(this, "Keltos", mountain, 120*2, 210*2);
		let thirdCity = new City(this, "Kratop", alchemy, 210*2, 35*2);
		let fourth = new City(this, "Telesee", cityType, 100*2, 130*2);
		let fifth = new City(this, "Telesee", coastal, 170*2, 150*2);

		this.goodTypes = [fish, ingot, wood, herbs, potion, sword];
		this.cityTypes = [coastal, mountain, alchemy, cityType];
		this.cities = [city, secondCity, thirdCity, fourth, fifth];
		this.links = [
			new CityLink(fourth, city, caravan),
			new CityLink(city, thirdCity, boat),
			new CityLink(secondCity, fourth, caravan),
			new CityLink(secondCity, fifth, caravan)
		];
		this.buildingTypes = [forge];
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

		transport.sprite = new easeljs.Sprite(link.type.spritesheet);
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
		this.timeElapsed += delta;

		this.transports.forEach((t) => t.update(delta));

		if (this.selectedTransport != null) {
			this.selectedCursor.x = this.selectedTransport.sprite.x;
			this.selectedCursor.y = this.selectedTransport.sprite.y;
		}

		this.cities.forEach((c) => c.update(delta));
	}

	public neighbours(city: City): CityLink[] {
		return this.links.filter((l) => l.other(city) != null);
	}
}

export class GoodOffer {
	public constructor(public good: GoodType, public price: number) {

	}
}

export class CityType {
	constructor(public name: string, public sellingGoods: GoodOffer[], public buyingGoods: GoodOffer[], public spritesheet: easeljs.SpriteSheet) {

	}
}

export class GoodQuantity {
	@observable quantity: number;

	constructor(public good: GoodType, quantity: number) {
		this.quantity = quantity;
	}
}

export class BuildingType {
	public constructor(public name: string, public price: number, public ingredients: GoodType[], public result: GoodType, public time: number) {

	}
}

export class CityUpgrade {
	public constructor(
		public price: number,
		public buyingOffers: GoodOffer[],
		public sellOffers: GoodOffer[],
		public transportTypes: TransportType[],
		public buildingTypes: BuildingType[]
	) {

	}
}

export class Building {
	@observable working: boolean = false;
	@observable timeRemaining: number = 0;

	public constructor(public city: City, public type: BuildingType) {

	}

	public update(delta: number) {
		if (this.working) {
			this.timeRemaining -= delta;

			if (this.timeRemaining < 0) {
				this.city.inventory.addItem(this.type.result, 1);

				this.working = false;
			}
		} else {
			this.tryStart();
		}
	}

	public tryStart() {
		if (this.working) {
			return;
		}

		if (this.type.ingredients.some((i) => !this.city.inventory.has(i, 1))) {
			return;
		}

		this.type.ingredients.forEach((i) => this.city.inventory.removeItem(i, 1));
		this.working = true;
		this.timeRemaining = this.type.time;
	}
}

export class Inventory {
	@observable items: GoodQuantity[] = [];

	public addItem(good: GoodType, quantity: number) {
		if (quantity < 0) {
			throw new Error("addItem: Trying to add negative quantity");
		}

		var itemQuantity = this.getItemQuantity(good);
		if (itemQuantity == null) {
			itemQuantity = new GoodQuantity(good, 0);
			this.items.push(itemQuantity);
		}

		itemQuantity.quantity += quantity;

		if (itemQuantity.quantity < 0) {
			this.items.splice(this.items.indexOf(itemQuantity), 1);
		}
	}

	public removeItem(good: GoodType, quantity: number) {
		if (quantity < 0) {
			throw new Error("addItem: Trying to remove negative quantity");
		}

		var itemQuantity = this.getItemQuantity(good);
		if (itemQuantity == null) {
			return;
		}

		itemQuantity.quantity -= quantity;

		if (itemQuantity.quantity <= 0) {
			this.items.splice(this.items.indexOf(itemQuantity), 1);
		}
	}

	public has(good: GoodType, quantity: number): boolean {
		return this.getQuantity(good) >= quantity;
	}

	public getQuantity(good: GoodType): number {
	   var itemQuantity = this.getItemQuantity(good);
	   if (itemQuantity != null) {
		   return itemQuantity.quantity;
	   } else {
		   return 0;
	   }
	}

	public isEmpty(): boolean {
		return this.items.length == 0;
	}

	private getItemQuantity(item: GoodType): GoodQuantity {
		return this.items.filter((iq) => { return iq.good == item; })[0];
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

export class GoodType {
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

	@observable transportAction: TransportAction;

	public constructor(public good: GoodType, action: TransportAction) {
		this.transportAction = action;
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
	public transportedGood: GoodType;

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
				// We execute our orders
				// This defines the order in which the orders will be carried out
				let orderTypes = [TransportAction.SELL, TransportAction.DROP, TransportAction.BUY, TransportAction.TAKE];
				orderTypes.forEach((orderType) => {
					let orders: CityAction[] = [];
					if (this.link.firstCity == this.location) {
						orders = this.firstCityActions;
					} else {
						orders = this.secondCityActions;
					}

					orders = orders.filter((o) => o.transportAction == orderType);

					orders.forEach((o) => {
						if (o.transportAction == TransportAction.BUY) {
							let offer = this.location.type.buyingGoods.filter((offer) =>
								offer.good == o.good
							)[0];
							if (offer == null) {
								return;
							}

							this.transportedGood = o.good;
							this.game.money -= offer.price;
						} else if (o.transportAction == TransportAction.SELL) {
							let offer = this.location.type.sellingGoods.filter((offer) =>
								offer.good == o.good
							)[0];
							if (offer == null) {
								return;
							}

							this.transportedGood = null;
							this.game.money += offer.price;
						} else if (o.transportAction == TransportAction.TAKE) {
							if (!this.location.inventory.has(o.good, 1)) {
								return;
							}
							this.location.inventory.removeItem(o.good, 1);
							this.transportedGood = o.good;
						} else if (o.transportAction == TransportAction.DROP) {
							if (this.transportedGood != o.good) {
								return;
							}
							this.location.inventory.addItem(o.good, 1);
						}
					})
				});

				// We go on our way
				this.sprite.gotoAndPlay("travel");
				this.offsetAroundCityX = 0;
				this.advancement = 0;
			}
		} else {
			// Taking the road~
			this.advancement += delta * this.SPEED / this.link.distance();

			if (this.advancement > 1) {
				this.location = this.link.other(this.location);
				this.waitingTimeRemaining = this.TIME_WAITING;
				this.sprite.gotoAndPlay("idle");
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
					<div className="box tooltip">
						<div style={{fontSize: 16}}>{this.props.good.name}</div>
						<div>{this.props.good.description}</div>
						{this.props.addedTooltipText != undefined && (
							<div style={{marginTop: 10}} dangerouslySetInnerHTML={{__html: this.props.addedTooltipText}}>
							</div>
						)}
					</div>
				)}
			>
				<div
					className={cs({
						"crispy": true,
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
							marginLeft: 4,
							marginRight: 4,
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
			<div>
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
						{this.props.game.money}<span className="money-icon"></span>

					</div>
					<hr />
					{selectedCity != null && (
					<div>
						<div style={{display: "flex", justifyContent: "space-between"}}>
							<div style={{fontSize: 14}}>{selectedCity.name}</div>
							<div className="city-type">{selectedCity.type.name}</div>
						</div>
						{!selectedCity.inventory.isEmpty() && (
							<div>
								Warehouse
								<div className="row-good">
									{selectedCity.inventory.items.map((gq) => (
										<GoodComponent
											good={gq.good}
											text={gq.quantity.toString()}
											pointerHover
										/>
									))}
								</div>
							</div>
						)}
						<hr />
						Selling
						<div className="row-good">
							{selectedCity.type.sellingGoods.map((goodOffer) => (
								<GoodComponent
									good={goodOffer.good}
									text={goodOffer.price.toString()}
									addedTooltipText={"This town buys " + goodOffer.good.name + " for " + goodOffer.price.toString() + "g."}
									pointerHover={false}/>
							))}
						</div>
						<hr />
						Buying
						<div className="row-good">
							{selectedCity.type.buyingGoods.map((goodOffer) => (
								<GoodComponent
									good={goodOffer.good}
									text={goodOffer.price.toString()}
									addedTooltipText={"This town buys " + goodOffer.good.name + " for " + goodOffer.price.toString() + "g."}
									pointerHover={false}/>
							))}
						</div>
						<hr />
						{this.props.game.neighbours(selectedCity).map((link) => (
						<button style={{width: "100%"}} onClick={() => this.buyWain(link)}>
							{link.type.name} to {link.other(selectedCity).name}<br />
							1500<span className="money-icon"></span>
						</button>
						))}
						{selectedCity.getAvailableBuildings().length > 0 && (
							<div>
								<hr />
								Buildings
								<div>
									{selectedCity.buildings.map((b) => (
										<div className="box">
											{b.type.name}
											<div style={{display: "flex", alignItems: "center"}}>
												<div className="row-good">
													{b.type.ingredients.map((i) => (
														<GoodComponent
															good={i}
															pointerHover={false}
														/>
													))}
												</div>
												{b.working ? (
													<div>
														<div
															className="arrow-progress crispy"
															style={{
																backgroundPosition: this.getProgressBarX(Math.round(100 * (1 - b.timeRemaining / b.type.time))) + "px 0"
															}}
														>
														</div>
													</div>
												) : (
													<div>
														<div className="arrow-progress crispy">
														</div>
													</div>
												)}
												<GoodComponent
													good={b.type.result}
													pointerHover={false}
												/>
											</div>
										</div>
									))}
								</div>
								<div>
									{selectedCity.getAvailableBuildings().map((bt) => (
										<TooltipComponent
											tooltip={(
												<div className="box tooltip">
													<div style={{fontSize: 16}}></div>
													<div style={{display: "flex", alignItems: "center"}}>
														<div className="row-good">
															{bt.ingredients.map((i) => (
																<GoodComponent
																	good={i}
																	pointerHover={false}
																/>
															))}
														</div>
														<div>
															->
														</div>
														<GoodComponent
															good={bt.result}
															pointerHover={false}
														/>
													</div>
												</div>
											)}
										>
										<button
											onClick={() => this.buyBuilding(selectedCity, bt)}
											style={{width: "100%", display: "flex", justifyContent: "space-between"}}
										>
											<div>
												Buy a {bt.name}
											</div>
											<div>
												{bt.price}<div className="money-icon"></div>
											</div>
										</button>
										</TooltipComponent>
									))}
								</div>
							</div>
						)}
					</div>
					)}
					{selectedTransport != null && (
					<div>
						<hr />
						{selectedTransport.link.firstCity.name}
						{this.displayListGoods(
							selectedTransport,
							this.getGoodsToDisplayFirstCity(),
							selectedTransport.firstCityActions,
							selectedTransport.link.firstCity
						)}
						<hr />
						{selectedTransport.link.secondCity.name}
						{this.displayListGoods(
							selectedTransport,
							this.getGoodsToDisplaySecondCity(),
							selectedTransport.secondCityActions,
							selectedTransport.link.secondCity
						)}
						<hr />
						<button style={{width: "100%"}}>
							Sell {selectedTransport.link.type.name}
						</button>
					</div>
					)}
				</div>
			</div>
			{DEBUG && (
				<div style={{marginTop: 10}}>
					Debug & cheats<br />
					Spawn item
					{selectedCity != null && (
						<div className="row-good">
							{this.props.game.goodTypes.map((good) => (
								<div onClick={() => selectedCity.inventory.addItem(good, 1)}>
									<GoodComponent
										good={good}
										pointerHover={true}
									/>
								</div>
							))}
						</div>
					)}
				</div>
			)}
			</div>
		);
	}

	private displayListGoods(transport: Transport, goods: GoodType[], actions: CityAction[], city: City) {
		return (
			<div className="row-good">
				{goods.map((good) => {
					let action = this.getAction(good, actions);
					return (
					<div>
						<GoodComponent
							good={good}
							onClick={() => { 
								this.toggleGoodCity(good, actions, city)
							}}
							text={action != null ? this.getActionText(action.transportAction) : null}
							pointerHover={true}
							addedTooltipText={action != null ? this.getActionTooltip(action.transportAction) : null}
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

	private getProgressBarX(percentage: number) {
		const SIZE = 32;
		const COUNT = 21;

		return -SIZE * Math.round(COUNT * percentage / 100);
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

	private getActionTooltip(action: TransportAction): string {
		let tt = "[Click] to change behaviour";
		switch (action) {
			case (TransportAction.BUY):
				tt += "<br />Will buy this good in the town's market";
				break;
			case (TransportAction.DROP):
				tt += "<br />Will drop this good in the town's warehouse";
				break;
			case (TransportAction.TAKE):
				tt += "<br />Will take this good in the town's warehouse";
				break;
			case (TransportAction.SELL):
				tt += "<br />Will sell this good in the town's market";
				break;
		}
		return tt;
	}

	private buyBuilding(city: City, type: BuildingType) {
		let building = new Building(city, type);
		city.buildings.push(building);
	}

	private toggleGoodCity(good: GoodType, actions: CityAction[], city: City) {
		let action = this.getAction(good, actions);
		let newAction = false;
		if (action == null) {
			action = new CityAction(good, CityAction.TRANSPORT_ACTIONS[0]);
			newAction = true;
			actions.push(action);
		}

		// If it's a new action, we must then do the check for i
		// If it's not, we must only check for i+1
		let i = CityAction.TRANSPORT_ACTIONS.indexOf(action.transportAction) + (newAction ? 0 : 1);
		let found = false;
		while (!found && i != CityAction.TRANSPORT_ACTIONS.length) {
			let possibleTransportAction = CityAction.TRANSPORT_ACTIONS[i];

			// Is this action acceptable ?
			if (possibleTransportAction == TransportAction.BUY) {
				if (!city.canBuy(good)) {
					i++;
					continue;
				}
				
			} else if (possibleTransportAction == TransportAction.SELL) {
				if (!city.canSell(good)) {
					i++;
					continue;
				}
			}

			action.transportAction = possibleTransportAction;
			found = true;
		}
		
		if (!found) {
			actions.splice(actions.indexOf(action), 1);
		}
	}

	private getGoodsToDisplay(link: CityLink, city: City): GoodType[] {
		let goods: GoodType[] = [];

		goods = goods.concat(city.type.sellingGoods.map((o) => o.good));
		goods = goods.concat(city.type.buyingGoods.map((o) => o.good));
		goods = goods.concat(link.other(city).type.sellingGoods.map((o) => o.good));
		goods = goods.concat(link.other(city).type.buyingGoods.map((o) => o.good));
		goods = goods.filter((g, i) => goods.indexOf(g) == i);

		return goods;
	}

	private update(delta: number) {
		this.props.game.update(delta);
	}

	private formatPercentage(perc: number): string {
		return perc < 10 ? "0" + perc.toString() : perc.toString() ;
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