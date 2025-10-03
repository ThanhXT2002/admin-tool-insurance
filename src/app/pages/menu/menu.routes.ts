import { Routes } from "@angular/router";
import { MenuList } from "./menu-list/menu-list";
import { MenuItem } from "./menu-item/menu-item";

export default [
     { path: 'list', component:  MenuList},
     { path: 'item/:id', component:  MenuItem},
] as Routes;
