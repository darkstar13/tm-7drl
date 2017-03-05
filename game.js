Math.seed(Math.floor(new Date().getTime()));
const WATER = new Tile(true,32,96);
const WOOD = new Tile(true,0,96);
const TLCORNER = new Tile(false,160,32);
const BLCORNER = new Tile(false,160,64);
const TRCORNER = new Tile(false,128,64);
const BRCORNER = new Tile(false,192,64);
const HWALL = new Tile(false,32,64);
const VWALL = new Tile(false,0,64);
const TDOWN = new Tile(false,64,32);
const TUP = new Tile(false,32,32);
const TLEFT = new Tile(false,96,32);
const TRIGHT = new Tile(false,128,32);
const XWALL = new Tile(false,0,32);
const HDOOR = new Tile(true,96,64);
const VDOOR = new Tile(true,64,64);
const STAIRS = new Item(0,128,nextLevel);
const FIRESHARD = new Item(0,160,increaseFire);
const ICESHARD = new Item(32,160,increaseIce);
const THUNDERSHARD = new Item(64,160,increaseThunder);

generateMap(0);
render();

function endTurn()
{
    document.getElementById("turn").innerHTML = ++Game.turn;
    document.getElementById("hp").innerHTML = Game.player.curhp+"/"+Game.player.maxhp;
    document.getElementById("fr").innerHTML = Game.player.fp+"%";
    document.getElementById("ic").innerHTML = Game.player.ip+"%";
    document.getElementById("th").innerHTML = Game.player.tp+"%";
}

function generateMap(magnitude)
{
    Game.kstatus = Status.WAIT;
    if(!magnitude) //first level
    {
        Game.map.rows = Math.random(10,20);
        Game.map.columns = Math.random(10,20);
        for(var y=0;y<Game.map.rows;y++)
            for(var x=0;x<Game.map.columns;x++)
            {
                Game.map.hidden[y*Game.map.columns+x] = 0;
                if(x==0 || x==Game.map.columns-1)
                    Game.map.tiles[y*Game.map.columns+x] = VWALL;
                else if(y==0 || y==Game.map.rows-1)
                    Game.map.tiles[y*Game.map.columns+x] = HWALL;
                else
                    Game.map.tiles[y*Game.map.columns+x] = WOOD;
            }
        Game.map.tiles[0] = TLCORNER;
        Game.map.tiles[Game.map.columns-1]=TRCORNER;
        Game.map.tiles[(Game.map.rows-1)*(Game.map.columns)] = BLCORNER;
        Game.map.tiles[(Game.map.rows-1)*(Game.map.columns)+Game.map.columns-1] = BRCORNER;

        //player position
        Game.player.position.x = Math.random(1,Game.map.columns-2);
        Game.player.position.y = Game.map.rows-2;

        //stairs
        var x,y;
        do
        {
            x = Math.random(1,Game.map.columns-2);
            y = Math.random(1,Game.map.rows-2);
        }
        while(x!=Game.player.position.x && x!=Game.player.position.y && Game.objects[y*Game.map.columns+x]!=undefined)
            Game.objects[y*Game.map.columns+x] = STAIRS;
        do
        {
            x = Math.random(1,Game.map.columns-2);
            y = Math.random(1,Game.map.rows-2);
        }
        while(x!=Game.player.position.x && x!=Game.player.position.y && Game.objects[y*Game.map.columns+x]!=undefined)
            var a = Math.random(0,2);
        switch(a)
        {
            case 0: Game.objects[y*Game.map.columns+x] = FIRESHARD;break;
            case 1: Game.objects[y*Game.map.columns+x] = ICESHARD;break;
            case 2: Game.objects[y*Game.map.columns+x] = THUNDERSHARD;break;
        }


    }
    Game.kstatus = Status.MAP;
}

function nextLevel()
{
    if(Game.enemies_left == 0)
    {
        console.log("To the next level!");
    }
    else
        switch(Game.level)
    {
            case 0:console.log("Please, collect the shard first :)");break;
            case 1:console.log("You should defeat all your opponents to proceed!");break;
            case 2:
            case 3:
            case 4:console.log("You have to kill every enemy mage before continuing");break;
            case 5:
            case 6:
            case 7:console.log("You must slaughter every organic creature on sight before searching for others");break;
            case 8:
            case 9:
    }
}

function increaseFire()
{
    //I could have written a better flow for this function to avoid checking the
    //first level condition every time but who cares, this function does not
    //contain any loop
    var oldvalue = Game.player.fp;
    var newvalue = undefined;
    Game.player.maxhp = Game.player.maxhp-Math.round(Game.player.maxhp/10);
    if(Game.player.curhp > Game.player.maxhp)
        Game.player.curhp = Game.player.maxhp;
    if(oldvalue == 0 && Game.player.ip == 0 && Game.player.tp == 0)
    {
        Game.player.fp = 30;
        Game.abilities[0] = 1;
        document.getElementById("f1").innerHTML = "Fire";
        Game.enemies_left--;
    }
    else
    {
        Game.player.ip = Game.player.ip>2?Game.player.ip-2:0;
        Game.player.tp = Game.player.tp>2?Game.player.tp-2:0;
        Game.player.fp +=5;
        newvalue = Game.player.fp;
    }

    //if first level newvalue is undefined so it will fail every evaluation
    if(oldvalue == 0 && newvalue > 0) //add first tier
    {
        Game.abilities[0] = 1;
        document.getElementById("f1").innerHTML = "Fire";
    }
    else if (oldvalue <100 && newvalue >= 100) //add second tier
    {
        Game.abilities[3] = 1;
        document.getElementById("f2").innerHTML = "Blaze";
    }
    else if (oldvalue <200 && newvalue >= 200) //add third tier
    {
        Game.abilities[6] = 1;
        document.getElementById("f3").innerHTML = "Inferno";
    }
    //Initially I put also some switch to remove the tiers, but on a second
    //thought I don't want them

    //remove from map
    Game.objects[Game.player.position.y*Game.map.columns+Game.player.position.x] = undefined;
}

function increaseIce()
{
    var oldvalue = Game.player.ip;
    var newvalue = undefined;
    Game.player.maxhp = Game.player.maxhp-Math.round(Game.player.maxhp/10);
    if(Game.player.curhp > Game.player.maxhp)
        Game.player.curhp = Game.player.maxhp;
    if(oldvalue == 0 && Game.player.fp == 0 && Game.player.tp == 0)
    {
        Game.player.ip = 30;
        Game.abilities[1] = 1;
        document.getElementById("g1").innerHTML = "Frost";
        Game.enemies_left--;
    }
    else
    {
        Game.player.fp = Game.player.fp>2?Game.player.fp-2:0;
        Game.player.tp = Game.player.tp>2?Game.player.tp-2:0;
        Game.player.ip +=5;
        newvalue = Game.player.ip;
    }

    //if first level newvalue is undefined so it will fail every evaluation
    if(oldvalue == 0 && newvalue > 0) //add first tier
    {
        Game.abilities[1] = 1;
        document.getElementById("g1").innerHTML = "Frost";
    }
    else if (oldvalue <100 && newvalue >= 100) //add second tier
    {
        Game.abilities[4] = 1;
        document.getElementById("g2").innerHTML = "Ice";
    }
    else if (oldvalue <200 && newvalue >= 200) //add third tier
    {
        Game.abilities[7] = 1;
        document.getElementById("g3").innerHTML = "Avalanche";
    }
    //Initially I put also some switch to remove the tiers, but on a second
    //thought I don't want them

    //remove from map
    Game.objects[Game.player.position.y*Game.map.columns+Game.player.position.x] = undefined;
}

function increaseThunder()
{
    var oldvalue = Game.player.tp;
    var newvalue = undefined;
    Game.player.maxhp = Game.player.maxhp-Math.round(Game.player.maxhp/10);
    if(Game.player.curhp > Game.player.maxhp)
        Game.player.curhp = Game.player.maxhp;
    if(oldvalue == 0 && Game.player.ip == 0 && Game.player.fp == 0)
    {
        Game.player.tp = 30;
        Game.abilities[2] = 1;
        document.getElementById("t1").innerHTML = "Spark";
        Game.enemies_left--;
    }
    else
    {
        Game.player.ip = Game.player.ip>2?Game.player.ip-2:0;
        Game.player.fp = Game.player.fp>2?Game.player.fp-2:0;
        Game.player.tp +=5;
        newvalue = Game.player.tp;
    }

    //if first level newvalue is undefined so it will fail every evaluation
    if(oldvalue == 0 && newvalue > 0) //add first tier
    {
        Game.abilities[2] = 1;
        document.getElementById("t1").innerHTML = "Spark";
    }
    else if (oldvalue <100 && newvalue >= 100) //add second tier
    {
        Game.abilities[5] = 1;
        document.getElementById("t2").innerHTML = "Bolt";
    }
    else if (oldvalue <200 && newvalue >= 200) //add third tier
    {
        Game.abilities[8] = 1;
        document.getElementById("t3").innerHTML = "Lightning";
    }
    //Initially I put also some switch to remove the tiers, but on a second
    //thought I don't want them

    //remove from map
    Game.objects[Game.player.position.y*Game.map.columns+Game.player.position.x] = undefined;
}

function aim(spell,startx,starty)
{
  console.log("reaim");
  //these two values are used to translate the pattern below/left/right/above
  //the player
  var xaim = Game.target==1||Game.target==3?0:Game.target==0?-1:1;
  var yaim = Game.target==0||Game.target==2?0:Game.target==1?-1:1;
  var offsetx,offsety;
  if(Game.target==1||Game.target==3) //aiming top or bottom
  {
    switch(Game.selected)
    {
      case "f1":
      {
        offsety = 3 * yaim;
        offsetx = 0;
        if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible && //path in front of player
           Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible &&
           Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible)
           {
             ctx.fillStyle = "rgba(0,150,0,0.5)";
             ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
           }
           else
           {
              ctx.fillStyle = "rgba(150,0,0,0.5)"
              ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              break;
           }
          if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-1)].accessible && //left branch accessible
             Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-2)].accessible &&
             Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-3)].accessible &&
             Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-4)].accessible)
             {
               ctx.fillStyle = "rgba(0,150,0,0.5)";
               ctx.fillRect((Game.player.position.x-4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
             }
             else
             {
               ctx.fillStyle = "rgba(150,0,0,0.5)";
               ctx.fillRect((Game.player.position.x-4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
             }
             if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+1)].accessible && //right branch accessible
                Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+2)].accessible &&
                Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+3)].accessible &&
                Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+4)].accessible)
                {
                  ctx.fillStyle = "rgba(0,150,0,0.5)";
                  ctx.fillRect((Game.player.position.x+4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                }
                else
                {
                  ctx.fillStyle = "rgba(150,0,0,0.5)";
                  ctx.fillRect((Game.player.position.x+4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                }
            break;

      }
      case "f2":
      {
        offsety = 3 * yaim;
        offsetx = 0;
        if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible && //path in front of player
           Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible &&
           Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible)
           {
             ctx.fillStyle = "rgba(0,150,0,0.5)";
             ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
           }
           else
           {
              ctx.fillStyle = "rgba(150,0,0,0.5)"
              ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              break;
           }
          if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-1)].accessible && //left branch accessible
             Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-2)].accessible)
             {
               ctx.fillStyle = "rgba(0,150,0,0.5)";
               ctx.fillRect((Game.player.position.x-2)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
               if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-3)].accessible && //left branch accessible
                  Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-4)].accessible)
                  {
                    ctx.fillStyle = "rgba(0,150,0,0.5)";
                    ctx.fillRect((Game.player.position.x-4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                  }
                  else
                  {
                    ctx.fillStyle = "rgba(150,0,0,0.5)"
                    ctx.fillRect((Game.player.position.x-4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                  }
             }
             else
             {
               ctx.fillStyle = "rgba(150,0,0,0.5)"
               ctx.fillRect((Game.player.position.x-2)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
             }
             if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+1)].accessible && //left branch accessible
                Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+2)].accessible)
                {
                  ctx.fillStyle = "rgba(0,150,0,0.5)";
                  ctx.fillRect((Game.player.position.x+2)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                  if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+3)].accessible && //left branch accessible
                     Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+4)].accessible)
                     {
                       ctx.fillStyle = "rgba(0,150,0,0.5)";
                       ctx.fillRect((Game.player.position.x+4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                     }
                     else
                     {
                       ctx.fillStyle = "rgba(150,0,0,0.5)"
                       ctx.fillRect((Game.player.position.x+4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                     }
                }
                else
                {
                  ctx.fillStyle = "rgba(150,0,0,0.5)"
                  ctx.fillRect((Game.player.position.x+2)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                }

          break;
      }
      case "f3":
      {
        offsety = 3 * yaim;
        offsetx = 0;
        if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible && //path in front of player
           Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible &&
           Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible)
           {
             ctx.fillStyle = "rgba(0,150,0,0.5)";
             ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
           }
           else
           {
              ctx.fillStyle = "rgba(150,0,0,0.5)"
              ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              break;
           }
          if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-1)].accessible) //left branch accessible
             {
               ctx.fillStyle = "rgba(0,150,0,0.5)";
               ctx.fillRect((Game.player.position.x-1)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
               if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-2)].accessible)
               {
                 ctx.fillStyle = "rgba(0,150,0,0.5)";
                 ctx.fillRect((Game.player.position.x-2)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                 if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-3)].accessible)
                 {
                   ctx.fillStyle = "rgba(0,150,0,0.5)";
                   ctx.fillRect((Game.player.position.x-3)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                   if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-4)].accessible)
                   {
                     ctx.fillStyle = "rgba(0,150,0,0.5)";
                     ctx.fillRect((Game.player.position.x-4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                   }
                   else
                   {
                     ctx.fillStyle = "rgba(150,0,0,0.5)"
                     ctx.fillRect((Game.player.position.x-4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                   }
                 }
                 else
                 {
                   ctx.fillStyle = "rgba(150,0,0,0.5)"
                   ctx.fillRect((Game.player.position.x-3)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                 }
               }
               else
               {
                 ctx.fillStyle = "rgba(150,0,0,0.5)"
                 ctx.fillRect((Game.player.position.x-2)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
               }
             }
             else
             {
               ctx.fillStyle = "rgba(150,0,0,0.5)"
               ctx.fillRect((Game.player.position.x-1)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
             }


             if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+1)].accessible) //right branch accessible
                {
                  ctx.fillStyle = "rgba(0,150,0,0.5)";
                  ctx.fillRect((Game.player.position.x+1)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                  if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+2)].accessible)
                  {
                    ctx.fillStyle = "rgba(0,150,0,0.5)";
                    ctx.fillRect((Game.player.position.x+2)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                    if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+3)].accessible)
                    {
                      ctx.fillStyle = "rgba(0,150,0,0.5)";
                      ctx.fillRect((Game.player.position.x+3)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                      if(Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+4)].accessible)
                      {
                        ctx.fillStyle = "rgba(0,150,0,0.5)";
                        ctx.fillRect((Game.player.position.x+4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                      }
                      else
                      {
                        ctx.fillStyle = "rgba(150,0,0,0.5)"
                        ctx.fillRect((Game.player.position.x+4)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                      }
                    }
                    else
                    {
                      ctx.fillStyle = "rgba(150,0,0,0.5)"
                      ctx.fillRect((Game.player.position.x+3)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                    }
                  }
                  else
                  {
                    ctx.fillStyle = "rgba(150,0,0,0.5)"
                    ctx.fillRect((Game.player.position.x+2)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                  }
                }
             else
             {
               ctx.fillStyle = "rgba(150,0,0,0.5)"
               ctx.fillRect((Game.player.position.x+1)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
             }
          break;
      }
      case "g1":
      {
        offsety = 2 * yaim;
        offsetx = 0;
        if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible && //path in front of player
           Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+offsetx)].accessible)
           {
             ctx.fillStyle = "rgba(0,150,0,0.5)";
             ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
           }
           else
           {
              ctx.fillStyle = "rgba(150,0,0,0.5)"
              ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              break;
           }
        if(Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x-1)].accessible)
        {
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          ctx.fillRect((Game.player.position.x-1)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
        }
        else
        {
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          ctx.fillRect((Game.player.position.x-1)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
        }
        if(Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+1)].accessible)
        {
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          ctx.fillRect((Game.player.position.x+1)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
        }
        else
        {
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          ctx.fillRect((Game.player.position.x+1)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
        }
        break;
      }
      case "g2":
      {
        if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x)].accessible && //path in front of player
           Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x)].accessible)
           {
             ctx.fillStyle = "rgba(0,150,0,0.5)";
             ctx.fillRect((Game.player.position.x)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
           }
           else
           {
              ctx.fillStyle = "rgba(150,0,0,0.5)"
              ctx.fillRect((Game.player.position.x)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              break;
           }

        if(Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x-1)].accessible) //left branch
        {
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          ctx.fillRect((Game.player.position.x-1)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
          if(Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x-2)].accessible &&
              Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x-2)].accessible)
              {
                ctx.fillStyle = "rgba(0,150,0,0.5)";
                ctx.fillRect((Game.player.position.x-2)*Game.tilesize+startx,(Game.player.position.y+1*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              }
              else
              {
                ctx.fillStyle = "rgba(150,0,0,0.5)";
                ctx.fillRect((Game.player.position.x-2)*Game.tilesize+startx,(Game.player.position.y+1*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              }
        }
        else
        {
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          ctx.fillRect((Game.player.position.x-1)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
        }

        if(Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+1)].accessible) //right branch
        {
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          ctx.fillRect((Game.player.position.x+1)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
          if(Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+2)].accessible &&
              Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x+2)].accessible)
              {
                ctx.fillStyle = "rgba(0,150,0,0.5)";
                ctx.fillRect((Game.player.position.x+2)*Game.tilesize+startx,(Game.player.position.y+1*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              }
              else
              {
                ctx.fillStyle = "rgba(150,0,0,0.5)";
                ctx.fillRect((Game.player.position.x+2)*Game.tilesize+startx,(Game.player.position.y+1*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              }
        }
        else
        {
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          ctx.fillRect((Game.player.position.x+1)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
        }
        break;
      }
      case "g3":
      {

        if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x)].accessible)//path in front of player
           {
             ctx.fillStyle = "rgba(0,150,0,0.5)";
             ctx.fillRect((Game.player.position.x)*Game.tilesize+startx,(Game.player.position.y+yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
           }
           else
           {
              ctx.fillStyle = "rgba(150,0,0,0.5)"
              ctx.fillRect((Game.player.position.x)*Game.tilesize+startx,(Game.player.position.y+yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
              break;
           }

           if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x-1)].accessible && //left branch
              Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x-1)].accessible)
              {
                ctx.fillStyle = "rgba(0,150,0,0.5)";
                ctx.fillRect((Game.player.position.x-1)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x-2)].accessible &&
                  Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x-2)].accessible &&
                  Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x-2)].accessible)
                  {
                    ctx.fillStyle = "rgba(0,150,0,0.5)";
                    ctx.fillRect((Game.player.position.x-2)*Game.tilesize+startx,(Game.player.position.y+3*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                  }
                  else
                  {
                    ctx.fillStyle = "rgba(150,0,0,0.5)";
                    ctx.fillRect((Game.player.position.x-2)*Game.tilesize+startx,(Game.player.position.y+3*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                  }
              }
          else
          {
            ctx.fillStyle = "rgba(150,0,0,0.5)";
            ctx.fillRect((Game.player.position.x-1)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
          }

          if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x+1)].accessible && //right branch
             Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+1)].accessible)
             {
               ctx.fillStyle = "rgba(0,150,0,0.5)";
               ctx.fillRect((Game.player.position.x+1)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
               if(Game.map.tiles[(Game.player.position.y+yaim)*Game.map.columns+(Game.player.position.x+2)].accessible &&
                 Game.map.tiles[(Game.player.position.y+2*yaim)*Game.map.columns+(Game.player.position.x+2)].accessible &&
                 Game.map.tiles[(Game.player.position.y+3*yaim)*Game.map.columns+(Game.player.position.x+2)].accessible)
                 {
                   ctx.fillStyle = "rgba(0,150,0,0.5)";
                   ctx.fillRect((Game.player.position.x+2)*Game.tilesize+startx,(Game.player.position.y+3*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                 }
                 else
                 {
                   ctx.fillStyle = "rgba(150,0,0,0.5)";
                   ctx.fillRect((Game.player.position.x+2)*Game.tilesize+startx,(Game.player.position.y+3*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
                 }
             }
         else
         {
           ctx.fillStyle = "rgba(150,0,0,0.5)";
           ctx.fillRect((Game.player.position.x+1)*Game.tilesize+startx,(Game.player.position.y+2*yaim)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
         }
        break;
      }
      case "t1":
      case "t2":
      case "t3":
      {
        offsety = 4 * yaim;
        offsetx = 4 * xaim;
        if(Game.map.tiles[(Game.player.position.y+offsety)*Game.map.columns+(Game.player.position.x+offsetx)].accessible)
          ctx.fillStyle = "rgba(0,150,0,0.5)";
          else
          ctx.fillStyle = "rgba(150,0,0,0.5)";
          ctx.fillRect((Game.player.position.x+offsetx)*Game.tilesize+startx,(Game.player.position.y+offsety)*Game.tilesize+starty,Game.tilesize,Game.tilesize);
          break;
        }
    }
  }
}

function lord_tachanka()
{
  Game.player.fp = 300;
  Game.player.ip = 300;
  Game.player.tp = 300;
  Game.abilities[0] = 1;
  Game.abilities[1] = 1;
  Game.abilities[2] = 1;
  Game.abilities[3] = 1;
  Game.abilities[4] = 1;
  Game.abilities[5] = 1;
  Game.abilities[6] = 1;
  Game.abilities[7] = 1;
  Game.abilities[8] = 1;
  Game.abilities[1] = 1;
  Game.abilities[0] = 1;
  document.getElementById("f1").innerHTML = "Fire";
  document.getElementById("f2").innerHTML = "Blaze";
  document.getElementById("f3").innerHTML = "Inferno";
  document.getElementById("g1").innerHTML = "Frost";
  document.getElementById("g2").innerHTML = "Ice";
  document.getElementById("g3").innerHTML = "Avalanche";
  document.getElementById("t1").innerHTML = "Spark";
  document.getElementById("t2").innerHTML = "Bolt";
  document.getElementById("t3").innerHTML = "Lightning";
  Game.kstatus = Status.MAP;
}
