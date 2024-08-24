export interface DropdownOption<T = string> {
	id?: number;
	value: T;
	label: string;
	level?: number;
	group?: string;
	color?: string;
}
