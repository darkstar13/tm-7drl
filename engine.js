"use strict";
Math.seed = function(newseed)
{
    Math.seed = newseed;
    return newseed;
}

Math.random = function(min,max)
{
    Math.seed=((7907*Math.seed)+7901)%(2147483647);
    return Math.seed%(max-min+1)+min;
}
var seed = Math.seed(Math.floor(new Date().getTime()));
var Status = Object.freeze({MAP:0,MENU:1,AIM:2,SKILLMENU:3,WAIT:4,INTRO:8,DEAD:9});
var Game =
    {
        kstatus:Status.INTRO,
        player:new Actor(0,0,Math.random(100,120),new Tile(false,0,0),0,0,0),
        npcs:[],
        Xnpcs:[],
        tilesize:32,
        size:{width:800,height:600,offsetx:undefined,offsety:undefined},
        spritesheet:new Image(),
        map:{tiles:[],hidden:[],rows:0,columns:0,rooms:[],accessible:[]},
        overlay:[],
        Xoverlay:[], //overlay next turn
        objects:[],
        abilities:[0,0,0,0,0,0,0,0,0],
        skills:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        turn:0,
        level:0,
        enemies_left:1,
        selected:undefined,
        skillselected:undefined,
        target:1, //0 - left, 1 - up, 2 - right, 3 - down
        aimed:[], //the cells where the spell will be cast. When aiming this array is populated, to avoid reprocessing the obstables again when casting
        oldpos:undefined, //old position for the player
        firemultiplier:Math.random(60,150)/100,
        icemultiplier:Math.random(60,150)/100,
        thundermultiplier:Math.random(60,150)/100
    }
Game.spritesheet.src = "spritesheet.png";
Game.size.offsetx = Math.floor(Game.size.width/Game.tilesize/2);
Game.size.offsety = Math.floor(Game.size.height/Game.tilesize/2);

var ctx = document.getElementById("cvs").getContext("2d");
window.focus();
window.onload = render;

var debug = console.log;

console.log = function(string)
{
    document.getElementById("console").innerHTML += "<div>"+string+"</div>";
}

function Tile(accessible,startx,starty)
{
    this.accessible = accessible;
    this.x = startx;
    this.y = starty;
}

function Item(startx,starty,action)
{
    this.x = startx;
    this.y = starty;
    this.trigger = action;
}

function Effect(tile,intensity,type) //type: 0 = fire, 1= ice
{
    this.x = tile.x;
    this.y = tile.y;
    this.value = intensity;
    this.type=type;
}

function Actor(posx,posy,maxhp,sprite,fire,ice,thunder)
{
    this.position = {x:posx, y:posy};
    this.curhp = maxhp;
    this.maxhp = maxhp;
    this.model = sprite;
    this.fp=fire;
    this.ip=ice;
    this.tp=thunder;
}

function Npc(name,posx,posy,maxhp,sprite,type,fire,thunder,ai)
{
    this.name = name;
    this.aitype = type; //0 - normal, 1 = pyro, 2= escape
    this.aistatus = 1; //1 = waiting, 0 = chasing
    this.style = Math.random(0,2);
    this.position = {x:posx, y:posy};
    this.curhp = maxhp;
    this.maxhp = maxhp;
    this.model = sprite;
    this.fp=fire;
    this.ip=0;
    this.tp=thunder;
    this.room = whichRoom(this.position.x,this.position.y);
    this.turn = Game.turn;
    this.act = ai;
    this.escapeDirection = {escaping:0,x:0,y:0};
    this.spell = (this.fp>this.tp || Math.random(1,10)>3)?this.fp>99?this.fp>199?"f3":"f2":"f1":this.tp>99?this.tp>199?"t3":"t2":"t1";
}

function init()
{
    document.body.focus();
}

function render()
{
    ctx.fillStyle="#222";
    ctx.fillRect(0,0,Game.size.width,Game.size.height);
    ctx.fillStyle="#000";
    if(Game.level==11)
    {
        ctx.fillStyle="SkyBlue";
        ctx.fillRect(0,0,Game.size.width,Game.size.height);
        ctx.fillStyle="#000";
    }

    var initx = 0; //iterator for the columns
    var inity = 0; //iterator for the rows
    var startx = 0; //offset for clipping
    var starty = 0;

    //determine startx and starty. To know the starting position where to draw
    //player position is assumed to be on the centre
    var tmp = Game.player.position.x - Game.size.offsetx;
    if(tmp < 0)
    {
        initx = 0;
        startx = -tmp;
        startx*=Game.tilesize;
    }
    else
    {
        initx = tmp;
        startx = -(initx*Game.tilesize) //since I start drawing with an offset in the map, here I correct that offset
    }
    tmp = Game.player.position.y - Game.size.offsety;
    if(tmp < 0)
    {
        inity = 0;
        starty = -tmp;
        starty*=Game.tilesize;
    }
    else
    {
        inity = tmp;
        starty = -(inity*Game.tilesize) //since I start drawing with an offset in the map, here I correct that offset
    }
    var currentTile, endy = Math.min(Game.map.rows,Game.size.height/32+inity), endx = Math.min(Game.map.columns,Game.size.width/32+initx);
    for(var my=inity;my<endy;my++)
        for(var mx=initx;mx<endx;mx++)
        {
            currentTile=Game.map.tiles[my*Game.map.columns+mx];
            if(Game.map.hidden[my*Game.map.columns+mx]==1 && !Game.skills[15]) //undiscovered area
            {
                ctx.fillRect(mx*Game.tilesize+startx,my*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                continue;
            }
            else
            {
                ctx.drawImage(Game.spritesheet,currentTile.x,currentTile.y,Game.tilesize,Game.tilesize,mx*Game.tilesize+startx,my*Game.tilesize+starty,Game.tilesize,Game.tilesize);

                if(Game.npcs[my*Game.map.columns+mx]!=undefined)
                    ctx.drawImage(Game.spritesheet,Game.npcs[my*Game.map.columns+mx].model.x,Game.npcs[my*Game.map.columns+mx].model.y,Game.tilesize,Game.tilesize,mx*Game.tilesize+startx,my*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                var obj = Game.objects[my*Game.map.columns+mx];
                if(obj != undefined)
                    ctx.drawImage(Game.spritesheet,obj.x,obj.y,Game.tilesize,Game.tilesize,mx*Game.tilesize+startx,my*Game.tilesize+starty,Game.tilesize,Game.tilesize);
            }

            if(Game.overlay[my*Game.map.columns+mx]!=undefined)
                ctx.drawImage(Game.spritesheet,Game.overlay[my*Game.map.columns+mx].x,Game.overlay[my*Game.map.columns+mx].y,Game.tilesize,Game.tilesize,mx*Game.tilesize+startx,my*Game.tilesize+starty,Game.tilesize,Game.tilesize);
        }

    //drawplayer
    ctx.drawImage(Game.spritesheet,Game.player.model.x,Game.player.model.y,Game.tilesize,Game.tilesize,Game.player.position.x*Game.tilesize+startx,Game.player.position.y*Game.tilesize+starty,Game.tilesize,Game.tilesize);

    if(Game.kstatus==Status.AIM) //draw aim
        aim(Game.selected,startx,starty);
}

function keybind(evt)
{
    if(Game.kstatus == Status.WAIT || Game.kstatus == Status.DEAD)
        return;
    var current_status = Game.kstatus;
    var next_status;
    var trigger_turn = false;
    var force_redraw = false;
    Game.kstatus = Status.WAIT;
    //TODO: what if charCode and keyCode share ambiguous values?
    var e=evt.keyCode!=0?evt.keyCode:evt.charCode;
    switch(e)
    {
        case 37: //key left
            {
                evt.preventDefault(); //suppress page scrolling
                if(current_status == Status.MAP)
                {
                    if(Game.player.position.x > 0 && ((
                        Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1].accessible == true && 
                        Game.npcs[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==undefined)||Game.skills[14]))
                    {
                        //can't walk on ice
                        if(Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x-1]!=undefined && !Game.skills[6])
                            if(Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x-1].type==1)
                            {
                                next_status = Status.MAP;
                                break;
                            }

                        var tile = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]; //UPDATE ROOM AND UNCOVER AREA
                        if(tile==VDOOR || tile==BVDOOR || Game.skills[14]) //update room
                        {
                            Game.player.room = whichRoom(Game.player.position.x-1,Game.player.position.y);
                            if(Game.map.hidden[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==1) //if hidden uncover area
                                uncover(Game.player.position.x-1,Game.player.position.y,Game.player.room);
                        }

                        Game.player.position.x--;
                        trigger_turn = true;
                        if(Game.skills[7])
                        {
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]=ASH;
                        }
                    }
                    next_status = Status.MAP;
                }
                else if(current_status == Status.MENU)
                {
                    //this is horseshit, but It's 3AM and I don't want to think
                    //abount something better
                    var next,unlocked;
                    switch(Game.selected)
                    {
                        case "f1":
                        case "f2":
                        case "f3":next = Game.selected;break;
                        case "g1":next = "f1";unlocked = Game.abilities[0];break;
                        case "g2":next = "f2";unlocked = Game.abilities[3];break;
                        case "g3":next = "f3";unlocked = Game.abilities[6];break;
                        case "t1":
                            {
                                unlocked = Game.abilities[1];
                                if(unlocked)
                                    next="g1";
                                else
                                {
                                    unlocked = Game.abilities[0];
                                    next="f1";
                                }
                                break;
                            }

                        case "t2":
                            {
                                unlocked = Game.abilities[4];
                                if(unlocked)
                                    next="g2";
                                else
                                {
                                    unlocked = Game.abilities[3];
                                    next="f2";
                                }
                                break;
                            }
                        case "t3":
                            {
                                unlocked = Game.abilities[7];
                                if(unlocked)
                                    next="g3";
                                else
                                {
                                    unlocked = Game.abilities[6];
                                    next="f3";
                                }
                                break;
                            }
                    }
                    if(unlocked)
                    {
                        document.getElementById(Game.selected).className = '';
                        Game.selected = next;
                        document.getElementById(Game.selected).className = 'selected';
                    }
                    next_status = Status.MENU;
                }
                else if(current_status == Status.AIM)
                {
                    next_status = Status.AIM;
                    force_redraw = true;
                    Game.target = 0;
                }
                else if(current_status == Status.SKILLMENU)
                {
                    next_status = Status.SKILLMENU;
                    var currentselec = parseInt(Game.skillselected.substring(1));
                    if(currentselec%4==0)
                        break;
                    document.getElementById(Game.skillselected).classList.remove("selected");
                    Game.skillselected = "s"+--currentselec;
                    document.getElementById(Game.skillselected).className+=" selected";
                    document.getElementById("skilldescription").innerHTML = Strings.skilldesc[currentselec];
                }
                else
                {
                    next_status = current_status;
                }
                break;
            }
        case 38: //Key up
            {
                evt.preventDefault(); //suppress page scrolling
                if(current_status == Status.MAP)
                {
                    if(Game.player.position.y > 0 &&
                        ((Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x].accessible == true &&
                        Game.npcs[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==undefined)||Game.skills[14]))
                    {
                        //can't walk on ice
                        if(Game.overlay[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]!=undefined && !Game.skills[6])
                            if(Game.overlay[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x].type==1)
                            {
                                next_status = Status.MAP;
                                break;
                            }

                        var tile = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]; //UPDATE ROOM AND UNCOVER AREA
                        if(tile==HDOOR || tile==BHDOOR || Game.skills[14]) //update room
                        {
                            Game.player.room = whichRoom(Game.player.position.x,Game.player.position.y-1);
                            if(Game.map.hidden[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==1) //if hidden uncover area
                                uncover(Game.player.position.x,Game.player.position.y-1,Game.player.room);
                        }

                        Game.player.position.y--;
                        if(Game.skills[7])
                        {
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]=ASH;
                        }
                        trigger_turn = true;
                    }
                    next_status = Status.MAP;
                }
                else if (current_status == Status.MENU)
                {
                    //this is horseshit, but It's 3AM and I don't want to think
                    //abount something better
                    var next,unlocked;
                    switch(Game.selected)
                    {
                        case "f1":
                        case "g1":
                        case "t1":next = Game.selected;break;
                        case "f2":next = "f1";unlocked = Game.abilities[0];break;
                        case "g2":next = "g1";unlocked = Game.abilities[1];break;
                        case "t2":next = "t1";unlocked = Game.abilities[2];break;
                        case "f3":next = "f2";unlocked = Game.abilities[3];break;
                        case "g3":next = "g2";unlocked = Game.abilities[4];break;
                        case "t3":next = "t2";unlocked = Game.abilities[5];break;
                    }
                    if(unlocked)
                    {
                        document.getElementById(Game.selected).className = '';
                        Game.selected = next;
                        document.getElementById(Game.selected).className = 'selected';
                    }
                    next_status = Status.MENU;
                }
                else if(current_status == Status.AIM)
                {
                    next_status = Status.AIM;
                    force_redraw = true;
                    Game.target = 1;
                }
                else if(current_status == Status.SKILLMENU)
                {
                    next_status = Status.SKILLMENU;
                    var currentselec = parseInt(Game.skillselected.substring(1));
                    if(currentselec<4)
                        break;
                    document.getElementById(Game.skillselected).classList.remove("selected");
                    currentselec-=4
                    Game.skillselected = "s"+currentselec;
                    document.getElementById(Game.skillselected).className+=" selected";
                    document.getElementById("skilldescription").innerHTML = Strings.skilldesc[currentselec];
                }
                else
                {
                    next_status = current_status;
                }
                break;

            }
        case 39: //Key right
            {
                evt.preventDefault(); //suppress page scrolling
                if(current_status == Status.MAP)
                {
                    if(Game.player.position.x < Game.map.columns-1 && ((
                        Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1].accessible == true && 
                        Game.npcs[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==undefined)||Game.skills[14]))
                    {
                        //can't walk on ice
                        if(Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x+1]!=undefined && !Game.skills[6])
                            if(Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x+1].type==1)
                            {
                                next_status = Status.MAP;
                                break;
                            }

                        var tile = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]; //UPDATE ROOM AND UNCOVER AREA
                        if(tile==VDOOR || tile==BVDOOR || Game.skills[14]) //update room
                        {
                            Game.player.room = whichRoom(Game.player.position.x+1,Game.player.position.y);
                            if(Game.map.hidden[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==1) //if hidden uncover area
                                uncover(Game.player.position.x+1,Game.player.position.y,Game.player.room);
                        }

                        Game.player.position.x++;
                        trigger_turn = true;
                        if(Game.skills[7])
                        {
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]=ASH;
                        }

                    }
                    next_status = Status.MAP;
                }
                else if (current_status == Status.MENU)
                {
                    //this is horseshit, but It's 3AM and I don't want to think
                    //abount something better
                    var next,unlocked;
                    next_status = Status.MENU;
                    switch(Game.selected)
                    {
                        case "f1":
                            {
                                unlocked = Game.abilities[1];
                                if(unlocked)
                                    next="g1";
                                else
                                {
                                    unlocked = Game.abilities[2];
                                    next="t1";
                                }
                                break;
                            }
                        case "f2":
                            {
                                unlocked = Game.abilities[4];
                                if(unlocked)
                                    next="g2";
                                else
                                {
                                    unlocked = Game.abilities[5];
                                    next="t2";
                                }
                                break;
                            }
                        case "f3":
                            {
                                unlocked = Game.abilities[7];
                                if(unlocked)
                                    next="g3";
                                else
                                {
                                    unlocked = Game.abilities[8];
                                    next="t3";
                                }
                                break;
                            }
                        case "g1":next = "t1";unlocked = Game.abilities[2];break;
                        case "g2":next = "t2";unlocked = Game.abilities[5];break;
                        case "g3":next = "t3";unlocked = Game.abilities[8];break;
                        case "t1":
                        case "t2":
                        case "t3":next = Game.selected;break;
                    }
                    if(unlocked)
                    {
                        document.getElementById(Game.selected).className = '';
                        Game.selected = next;
                        document.getElementById(Game.selected).className = 'selected';
                    }
                }
                else if(current_status == Status.AIM)
                {
                    next_status = Status.AIM;
                    force_redraw = true;
                    Game.target = 2;
                }
                else if(current_status == Status.SKILLMENU)
                {
                    next_status = Status.SKILLMENU;
                    var currentselec = parseInt(Game.skillselected.substring(1));
                    if(currentselec%4==3)
                        break;
                    document.getElementById(Game.skillselected).classList.remove("selected");
                    Game.skillselected = "s"+(++currentselec);
                    document.getElementById(Game.skillselected).className+=" selected";
                    document.getElementById("skilldescription").innerHTML = Strings.skilldesc[currentselec];
                }
                else
                {
                    next_status = current_status;
                }
                break;

            }
        case 40: //Key down
            {
                evt.preventDefault(); //suppress page scrolling
                if(current_status == Status.MAP)
                {
                    if(Game.player.position.y < Game.map.rows-1 && ((
                        Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x].accessible == true &&
                        Game.npcs[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==undefined)||Game.skills[14]))
                    {
                        //can't walk on ice
                        if(Game.overlay[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]!=undefined && !Game.skills[6])
                            if(Game.overlay[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x].type==1)
                            {
                                next_status = Status.MAP;
                                break;
                            }

                        var tile = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]; //UPDATE ROOM AND UNCOVER AREA
                        if(tile==HDOOR || tile==BHDOOR || Game.skills[14]) //update room
                        {
                            Game.player.room = whichRoom(Game.player.position.x,Game.player.position.y+1);
                            if(Game.map.hidden[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==1) //if hidden uncover area
                                uncover(Game.player.position.x,Game.player.position.y+1,Game.player.room);
                        }

                        Game.player.position.y++;
                        trigger_turn = true;
                        if(Game.skills[7])
                        {
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]=ASH;
                        }

                    }
                    next_status = Status.MAP;
                }
                else if (current_status == Status.MENU)
                {
                    //this is horseshit, but It's 3AM and I don't want to think
                    //abount something better
                    var next,unlocked = undefined;
                    switch(Game.selected)
                    {
                        case "f1":next = "f2";unlocked = Game.abilities[3];break;
                        case "g1":next = "g2";unlocked = Game.abilities[4];break;
                        case "t1":next = "t2";unlocked = Game.abilities[5];break;
                        case "f2":next = "f3";unlocked = Game.abilities[6];break;
                        case "g2":next = "g3";unlocked = Game.abilities[7];break;
                        case "t2":next = "t3";unlocked = Game.abilities[8];break;
                        case "f3":
                        case "g3":
                        case "t3":next = Game.selected;break;
                    }
                    if(unlocked)
                    {
                        document.getElementById(Game.selected).className = '';
                        Game.selected = next;
                        document.getElementById(Game.selected).className = 'selected';
                    }
                    next_status = Status.MENU;
                }
                else if(current_status == Status.AIM)
                {
                    next_status = Status.AIM;
                    force_redraw = true;
                    Game.target = 3;
                }
                else if(current_status == Status.SKILLMENU)
                {
                    next_status = Status.SKILLMENU;
                    var currentselec = parseInt(Game.skillselected.substring(1));
                    if(currentselec>15)
                        break;
                    document.getElementById(Game.skillselected).classList.remove("selected");
                    currentselec+=4
                    Game.skillselected = "s"+currentselec;
                    document.getElementById(Game.skillselected).className+=" selected";
                    document.getElementById("skilldescription").innerHTML = Strings.skilldesc[currentselec];
                }
                else
                {
                    next_status = current_status;
                }
                break;

            }
        case 122://this way it can work even with caps lock enabled //z,Z
        case 90:
            {
                if(current_status == Status.MAP)
                {
                    next_status = Status.MENU;
                    if(!Game.map.tiles[Game.player.position.x+Game.player.position.y*Game.map.columns].accessible)
                    {
                        next_status = Status.MAP;
                        break;
                    }
                    if(Game.abilities[0])
                    {
                        document.getElementById("f1").className = "selected";
                        Game.selected = "f1";
                    }
                    else if(Game.abilities[1])
                    {
                        document.getElementById("g1").className = "selected";
                        Game.selected = "g1";
                    }
                    else if(Game.abilities[2])
                    {
                        document.getElementById("t1").className = "selected";
                        Game.selected = "t1";
                    }
                    else
                        next_status = Status.MAP;
                }
                else if (current_status == Status.MENU)
                {
                    force_redraw = true;
                    next_status = Status.AIM;
                }
                else if (current_status == Status.AIM)
                {
                    cast(Game.selected);
                    trigger_turn = true;
                    document.getElementById(Game.selected).className = "";
                    next_status = Status.MAP;
                }
                else if(current_status == Status.SKILLMENU)
                {
                    next_status = Status.SKILLMENU;
                    var sselected = parseInt(Game.skillselected.substring(1));
                    var floorsel = Math.floor(sselected/4);
                    if(floorsel==0 && Game.level<1 ||
                        floorsel==1 && Game.level<3 ||
                        floorsel==2 && Game.level<5 ||
                        floorsel==3 && Game.level<7 ||
                        floorsel==4 && Game.level<9) //level unmet
                        break;

                    floorsel*=4
                    var floorselmul = floorsel;
                    if(Game.skills[floorselmul++] == 1 ||
                        Game.skills[floorselmul++] == 1 ||
                        Game.skills[floorselmul++] == 1 ||
                        Game.skills[floorselmul++] == 1) //already one skill selected
                        break;

                    Game.skills[sselected] = 1;
                    document.getElementById("s"+floorsel++).className="locked";
                    document.getElementById("s"+floorsel++).className="locked";
                    document.getElementById("s"+floorsel++).className="locked";
                    document.getElementById("s"+floorsel++).className="locked";
                    document.getElementById(Game.skillselected).className="unlocked";

                    if(sselected==3) // World is Grey skill
                    {
                        Game.firemultiplier = 1.0;
                        Game.icemultiplier = 1.0;
                        Game.thundermultiplier = 1.0;
                    }
                    if(sselected==13)
                    {
                        if(Game.player.fp >= Game.player.ip && Game.player.fp >= Game.player.tp)
                            Game.player.fp = Math.floor(Game.player.fp*1.5);
                        else if (Game.player.ip >= Game.player.fp && Game.player.ip >= Game.player.tp)
                            Game.player.ip = Math.floor(Game.player.ip*1.5);
                        else if (Game.player.tp >= Game.player.fp && Game.player.tp >= Game.player.ip)
                            Game.player.tp = Math.floor(Game.player.tp*1.5);
                    }
                }
                else
                {
                    next_status = current_status;
                }
                break;
            }
        case 120: //x,X
        case 88:
            {
                if(current_status == Status.MENU || current_status == Status.AIM)
                {
                    next_status = Status.MAP;
                    force_redraw = true;
                    document.getElementById(Game.selected).className = '';
                    Game.selected = undefined;
                }
                else if(current_status == Status.SKILLMENU)
                {
                    next_status = Status.MAP;
                    document.getElementById("skillmenu").style.display="none";
                    document.getElementById("skillbg").style.display="none";
                    document.getElementById(Game.skillselected).classList.remove("selected");
                    Game.skillselected=undefined;
                }
                else
                {
                    trigger_turn = false;
                    next_status = Status.MAP
                }
                break;
            }
        case 107: //k,K
        case 75:
            {
                if(current_status==Status.SKILLMENU)
                {
                    next_status = Status.MAP;
                    document.getElementById("skillmenu").style.display="none";
                    document.getElementById("skillbg").style.display="none";
                    document.getElementById(Game.skillselected).classList.remove("selected");
                    Game.skillselected=undefined;
                }
                else if(current_status != Status.INTRO)
                {
                    next_status = Status.SKILLMENU;
                    document.getElementById("skillmenu").style.display="block";
                    document.getElementById("skillbg").style.display="block";
                    if(Game.selected!=undefined)
                    {
                        document.getElementById(Game.selected).className = '';
                        Game.selected = undefined;
                    }
                    Game.skillselected="s0";
                    document.getElementById(Game.skillselected).className += ' selected';
                    document.getElementById("skilldescription").innerHTML = Strings.skilldesc[0];
                    force_redraw = true; //to clear green tiles if one was aiming
                }
                else
                {
                    next_status = current_status;
                }
                break;
            }
        case 108: //l,L
        case 76: 
            {
                if(Game.skills[9]==1 && current_status==Status.MAP)
                {
                    console.log(Strings.lumina);
                    Game.npcs.forEach(function(cur, index, arr)
                        {
                        if(cur!=undefined)
                        {
                            cur.curhp=1;
                            cur.aistatus=99;
                        }
                        });

                    trigger_turn = true;
                    Game.skills[9]=2;
                    for(var i=0;i<Game.map.tiles.length;i++)
                    {
                        if(Game.map.tiles[i]==WOOD)
                            Game.map.tiles[i]=ASH;
                        else if(Game.map.tiles[i]==TRAP)
                            Game.map.tiles[i]=BTRAP;
                        else if(Game.map.tiles[i]==HDOOR)
                            Game.map.tiles[i]=BHDOOR;
                        else if(Game.map.tiles[i]==VDOOR)
                            Game.map.tiles[i]=BVDOOR;

                        if(Game.objects[i]==STAIRS)
                            Game.objects[i]=BSTAIRS;
                    }
                }
                else if(Game.skills[9]==2 && current_status==Status.MAP)
                    console.log(Strings.nolumina);
                next_status = current_status;
                break;
            }
        case 97: //a,A
        case 65:
            {
                if(current_status == Status.MAP && Game.skills[10])
                {
                    if(Game.player.position.x > 1 &&
                        Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1].accessible == true && 
                        Game.npcs[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==undefined && 
                        Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-2].accessible &&
                        Game.npcs[Game.player.position.y*Game.map.columns+Game.player.position.x-2]==undefined)
                    {
                        //can't walk on ice
                        if((Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x-1]!=undefined && 
                            Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x-1].type==1 ||
                            Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x-2]!=undefined &&
                            Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x-2].type==1) && !Game.skills[6])
                            {
                                next_status = Status.MAP;
                                break;
                            }

                        var tile = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]; //UPDATE ROOM AND UNCOVER AREA
                        var tile2 = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1];
                        if(tile==VDOOR || tile==BVDOOR || tile2==VDOOR || tile2 == BVDOOR) //update room
                        {
                            Game.player.room = whichRoom(Game.player.position.x-2,Game.player.position.y);
                            if(Game.map.hidden[Game.player.position.y*Game.map.columns+Game.player.position.x-2]==1)
                                uncover(Game.player.position.x-2,Game.player.position.y,Game.player.room);
                        }

                        Game.player.position.x-=2;
                        trigger_turn = true;
                        if(Game.skills[7])
                        {
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]=ASH;
                            //exclusive for dash
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+2]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+2]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+2]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+2]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+2]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+2]=ASH;
                        }
                    }
                }

                next_status = current_status;
                break;
            }
        case 119: //w,W
        case 87:
            {
                if(current_status == Status.MAP && Game.skills[10])
                {
                    if(Game.player.position.y > 1 &&
                        Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x].accessible == true && 
                        Game.npcs[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==undefined && 
                        Game.map.tiles[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x].accessible &&
                        Game.npcs[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x]==undefined)
                    {
                        //can't walk on ice
                        if((Game.overlay[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]!=undefined && 
                            Game.overlay[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x].type==1 ||
                            Game.overlay[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x]!=undefined &&
                            Game.overlay[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x].type==1) && !Game.skills[6])
                            {
                                next_status = Status.MAP;
                                break;
                            }

                        var tile = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]; //UPDATE ROOM AND UNCOVER AREA
                        var tile2 = Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x];
                        if(tile==HDOOR || tile==BHDOOR || tile2==HDOOR || tile2 == BHDOOR) //update room
                        {
                            Game.player.room = whichRoom(Game.player.position.x,Game.player.position.y-2);
                            if(Game.map.hidden[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x]==1)
                                uncover(Game.player.position.x,Game.player.position.y-2,Game.player.room);
                        }

                        Game.player.position.y-=2;
                        trigger_turn = true;
                        if(Game.skills[7])
                        {
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]=ASH;
                            //exclusive for dash
                            if(Game.map.tiles[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x+1]=ASH;
                        }
                    }
                }

                next_status = current_status;
                break;

            }
        case 100: //d,D
        case 68:
            {
                if(current_status == Status.MAP && Game.skills[10])
                {
                    if(Game.player.position.x < Game.map.columns-2 &&
                        Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1].accessible == true && 
                        Game.npcs[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==undefined && 
                        Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+2].accessible &&
                        Game.npcs[Game.player.position.y*Game.map.columns+Game.player.position.x+2]==undefined)
                    {
                        //can't walk on ice
                        if((Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x+1]!=undefined && 
                            Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x+1].type==1 ||
                            Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x+2]!=undefined &&
                            Game.overlay[Game.player.position.y*Game.map.columns+Game.player.position.x+2].type==1) && !Game.skills[6])
                            {
                                next_status = Status.MAP;
                                break;
                            }

                        var tile = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]; //UPDATE ROOM AND UNCOVER AREA
                        var tile2 = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1];
                        if(tile==VDOOR || tile==BVDOOR || tile2==VDOOR || tile2 == BVDOOR) //update room
                        {
                            Game.player.room = whichRoom(Game.player.position.x+2,Game.player.position.y);
                            if(Game.map.hidden[Game.player.position.y*Game.map.columns+Game.player.position.x+2]==1)
                                uncover(Game.player.position.x+2,Game.player.position.y,Game.player.room);
                        }

                        Game.player.position.x+=2;
                        trigger_turn = true;
                        if(Game.skills[7])
                        {
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]=ASH;
                            //exclusive for dash
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-2]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-2]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-2]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-2]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-2]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-2]=ASH;
                        }
                    }
                }

                next_status = current_status;
                break;
            }
        case 115: //s,S
        case 83: 
            {
                if(current_status == Status.MAP && Game.skills[10])
                {
                    if(Game.player.position.y < Game.map.rows-2 &&
                        Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x].accessible == true && 
                        Game.npcs[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==undefined && 
                        Game.map.tiles[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x].accessible &&
                        Game.npcs[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x]==undefined)
                    {
                        //can't walk on ice
                        if((Game.overlay[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]!=undefined && 
                            Game.overlay[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x].type==1 ||
                            Game.overlay[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x]!=undefined &&
                            Game.overlay[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x].type==1) && !Game.skills[6])
                            {
                                next_status = Status.MAP;
                                break;
                            }

                        var tile = Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]; //UPDATE ROOM AND UNCOVER AREA
                        var tile2 = Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x];
                        if(tile==HDOOR || tile==BHDOOR || tile2==HDOOR || tile2 == BHDOOR) //update room
                        {
                            Game.player.room = whichRoom(Game.player.position.x,Game.player.position.y+2);
                            if(Game.map.hidden[(Game.player.position.y+2)*Game.map.columns+Game.player.position.x]==1)
                                uncover(Game.player.position.x,Game.player.position.y+2,Game.player.room);
                        }

                        Game.player.position.y+=2;
                        trigger_turn = true;
                        if(Game.skills[7])
                        {
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y+1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-1)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x+1]=ASH;
                            if(Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[Game.player.position.y*Game.map.columns+Game.player.position.x-1]=ASH;
                            //exclusive for dash
                            if(Game.map.tiles[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x]==WOOD)
                                Game.map.tiles[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x-1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x-1]=ASH;
                            if(Game.map.tiles[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x+1]==WOOD)
                                Game.map.tiles[(Game.player.position.y-2)*Game.map.columns+Game.player.position.x+1]=ASH;
                        }
                    }
                }

                next_status = current_status;
                break;

            }
        case 116: //t,T
        case 84:
            {
                if(current_status==Status.MAP)
                    trigger_turn = true;
                next_status = current_status;
                break;
            }
        case 112:
        case 80:
            {
                if(current_status == Status.INTRO)
                {
                    document.getElementById("intro").style.display="none";
                    document.getElementById("introbg").style.display="none";
                    next_status = Status.MAP;
                }
                else
                {
                    document.getElementById("intro").style.display="block";
                    document.getElementById("introbg").style.display="block";
                    next_status = Status.INTRO;
                }
                break;
            }
        default:
            {
                next_status = current_status;
                break;
            }
    }

    if(trigger_turn)
    {
        if(!Game.skills[18] || Math.random(1,4)!=1)
        {
            document.getElementById("console").innerHTML = '';
            var current_cell_object = Game.objects[Game.player.position.y*Game.map.columns+Game.player.position.x];
            if(current_cell_object != undefined)
            current_cell_object.trigger();
            var res = endTurn();
            if(!res)
                next_status = Status.DEAD;
        }
        else
            console.log("You borrow some time...");
        render();
    }
    Game.kstatus = next_status;
    if(force_redraw)
        render(); //force rerender of the tiles even if the turn didn't elapsed
}
