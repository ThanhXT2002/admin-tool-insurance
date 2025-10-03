import { Component } from '@angular/core';
import { Toolbar } from "primeng/toolbar";
import { Button } from "primeng/button";

@Component({
  selector: 'app-menu-item',
  imports: [Toolbar, Button],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.scss'
})
export class MenuItem {


  addNew(){

  }

}
