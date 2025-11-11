export interface DropdownOption<T = string> {
	id?: number;
	value: T | null;
	label: string | null;
	level?: number;
	group?: string;
	color?: string;
}
