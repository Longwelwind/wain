import {Building, Inventory, GoodOffer, Game, CityType, BuildingType, GoodType} from "./main";
import {observable} from "mobx";

export default class City {
	sprite: easeljs.Sprite;
	@observable buildings: Building[] = [];
	inventory: Inventory = new Inventory();

	constructor(public game: Game, public name: string, public type: CityType, public x: number, public y: number) {
		
	}

	getAvailableBuildings(): BuildingType[] {
		return this.game.buildingTypes;
	}

	update(delta: number) {
		this.buildings.map((b) => {
			b.update(delta);
		});
	}

	public canBuy(good: GoodType): boolean {
		return this.getBuyOffer(good) != null;
	}

	public canSell(good: GoodType): boolean {
		return this.getSellOffer(good) != null;
	}

	public getBuyOffer(good: GoodType): GoodOffer {
		return this.type.buyingGoods.filter((o) => o.good == good)[0];
	}

	public getSellOffer(good: GoodType): GoodOffer {
		return this.type.sellingGoods.filter((o) => o.good == good)[0];
	}
}