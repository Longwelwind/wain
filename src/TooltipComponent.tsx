import * as React from "react"
import { observer } from "mobx-react";
import { observable } from "mobx";
import * as cs from "react-classset";

@observer
export default class TooltipComponent extends React.Component<TooltipComponentProps, null> {
	public static defaultProps: Partial<TooltipComponentProps> = {
		enabled: true,
		sideToSide: false
	};

	tooltipContainer: HTMLSpanElement;
	@observable hovered: boolean = false;
	@observable x: number = 0;
	@observable y: number = 0;

	public render() {
		return (
			<div
				style={ { position: "relative" } }
				onMouseEnter={ (e) => this.onMouseEnter(e) }
				onMouseLeave={ (e) => this.onMouseLeave(e) }
				ref={ (e) => this.tooltipContainer = e }
			>
				{ this.hovered && (
					<div
						className={"tooltip-container"}
					>
						{ this.props.tooltip }
					</div>
				) }
				{ this.props.children }
			</div>
		);
	}

	public onMouseEnter(e: React.MouseEvent<HTMLSpanElement>): void {
		if (this.props.enabled) {
			this.hovered = true;
		}
	}

	public onMouseLeave(e: React.MouseEvent<HTMLSpanElement>): void {
		this.hovered = false;
	}
}

interface TooltipComponentProps {
	tooltip: JSX.Element;
	enabled?: boolean;
	sideToSide?: boolean;
}