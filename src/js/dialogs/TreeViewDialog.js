// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/TreeViewDialog.json

class TreeViewDialog extends AbstractDialog {

constructor(options) {
    super(UISPECS.TreeViewDialog, options);
    this._handleCreateTreeButton=this._handleCreateTreeButton.bind(this);
    this._binds.createTreeButton.addEventListener('click', this._handleCreateTreeButton);

    this._handleCreateHierarchyJSONFile=this._handleCreateHierarchyJSONFile.bind(this);
    this._binds.createHierarchyJSONFile.addEventListener('click', this._handleCreateHierarchyJSONFile);
    
    this._handleReadJSONButton=this._handleReadJSONButton.bind(this);
    this._binds.ReadJSONButton.addEventListener('click', this._handleReadJSONButton);

    fetch("data_schema.json").then(response => response.json()).then(data_schema=>{
      var json =data_schema['stats']['global'];
      nbProperty=0;
      for (var x in json) {
          let p=new Property(x,nbProperty);  
          var d={text: "",id:"", expanded: true,iconCls: "fa fa-folder"};
          d.text=x;
          d.id=nbProperty;
          nbProperty++;
          propertyList.push(d);
   
          for (var y in json[x]) {
              let pp=new PropValue(y,json[x][y])
              p.types.push(pp);
          }
          propertyArr.push(p);
      }
      //console.log(propertyArr);
   });
   fetch("data_schema.json").then(response => response.json()).then(data_schema=>{
      var json =data_schema['stats']['elements'];
      nbElement=0;
      for (var x in json) {
          let e=new Element(nbElement);  
          nbElement++;
          for (var y in json[x]) {
              let pp=new PropValue(y,json[x][y])
              e.properties.push(pp);
          }
          ElementArr.push(e);
      }
      //console.log(ElementArr);
   });
}
_handleReadJSONButton = function() {
  jQuery(function ($) {
    $("#treeview").shieldTreeView({
        dragDrop: true,
        dragDropScope: "treeview-dd-scope",
        dataSource: propertyList,
        events: {
            droppableOver: function(e) {
                if (!e.valid) {
                    // if an invalid draggable item is over a tree item,
                    // re-validate it - i.e. if it is a doc-item, allow the drop
                    if ($(e.draggable).hasClass('doc-item')) {
                        e.valid = true;
                    }
                }
            },
            drop: function (e) {
                var valid = e.valid;
                if (!valid) {
                    // if not valid, it means something different than a tree node
                    // is being dropped - in this case, check for a doc item and 
                    // set valid to true if so
                    if ($(e.draggable).hasClass('doc-item')) {
                        valid = true;
                    }
                }
                if (valid) {
                    if (e.sourceNode) {
                        // dropping a treeview node - move it
                        this.append(e.sourceNode, e.targetNode);
                    }
                    else {
                        // dragging a doc item - insert a new one
                        // and remove the dragged element
                        this.append({ text: $(e.draggable).html() }, e.targetNode);
                        $(e.draggable).remove();
                    }
                    // disable the animation
                    e.skipAnimation = true;
                }
            }
        }
    });
    // setup drag and drop handlers for the elements outside the treeview
    $(".doc-item").shieldDraggable({
        scope: "treeview-dd-scope",
        helper: function() { 
            return $(this.element).clone().appendTo(document.body);
        },
        events: {
            stop: function (e) {
                // always cancel the movement of the item;
                // if a drop over a valid target ocurred, we will handle that 
                // in the respective drop handler
                e.preventDefault();
            }
        }
    });
    // handle drop on the trash can
    $(".item-trash").shieldDroppable({
        scope: "treeview-dd-scope",
        hoverCls: "item-trash-dropover",
        tolerance: "touch",
        events: {
            drop: function (e) {
                if ($(e.draggable).hasClass('sui-treeview-item-text')) {
                    // dropped a treeview item - delete it
                    $("#treeview").swidget("TreeView").remove($(e.draggable).closest('.sui-treeview-item'));
                }
                else {
                    // dropped a doc-item, just delete it from the DOM
                    $(e.draggable).remove();
                }
                // disable animation of the droppable, so that it
                // does not get animated if cancelled
                e.skipAnimation = true;
            }
        }
    });
});

}

_handleCreateHierarchyJSONFile = function() {
  let jsonObject = extractInfoTree(Htree);
  console.log("File has been created"+jsonObject);
  saveJSON(JSON.stringify(jsonObject ));
  
}
_handleCreateTreeButton = function() {
  var element = document.querySelector(".sui-treeview-list");
  element.id="Dtreeview"
  var nav = getNav($('#Dtreeview'));
  function getNav($ul) {
      return $ul.children('li').map(function () {
          var $this = $(this), obj = $this.data(), $ul = $this.children('ul');
          if ($ul.length) {
              obj.child = getNav($ul)
          }
          return obj;
      }).get()
  }
 //console.log(nav);
 jsonHArr=createJSON(nav,jsonHArr);
 jsonView.format(jsonHArr, '.root');
 //removeElement('Dtreeview') ;
}
}
function removeElement(elementId) {
  // Removes an element from the document
  var element = document.getElementById(elementId);
  element.parentNode.removeChild(element);
}
function extractInfoTree(node)
{
  var obj=new Object();
  if(node!==null)
  {
    if(node.isPropClassName==true||node.isroot==true)
    {
      //console.log(node.property);
      obj.property = node.property;
      obj.visValue = node.value;
      obj.count = node.count;
    }
    else
    {
      obj.property = node.parent.property;
      obj.value = node.property;
      obj.visValue = node.value;
      obj.count = node.count;
    }
    obj.color = node.color;
    if(node.children!=null)
    {
      obj.children=[];
      node.children.forEach((child) => {
        obj.children.push(extractInfoTree(child));
      });
    }
    return obj;
  }
  return null;
}
function saveJSON(data) {
  //let data = "Whatever it is you want to save";
  let bl = new Blob([data], {
     type: "text/html"
  });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(bl);
  a.download = "data.json";
  a.hidden = true;
  document.body.appendChild(a);
  a.innerHTML =
     "someinnerhtml";
  a.click();
}
var Htree;
class Property  {
  constructor(name,id) {
  this.name = name;//string
  this.id=id;//int
  this.types=[]; //PropValue
  }
  }
  class PropValue  {
  constructor(type,value) {
  this.type = type;//string
  this.value=value;//int
  }
  }
  
  /*class HNode  {
  constructor(property,value) {
  this.children = [];//string
  this.property=property;//int
  this.elem=[]; //html elem
  }
  }*/
  class Element  {
  constructor(id) {
  this.id = id;//string
  this.properties=[]; //PropValue
  }
  }
  let propertyList=new Array();
  let propertyArr=new Array();
  let ElementArr=new Array();
  var nbProperty=0;
  var nbElement=0;
  var jsonHArr ='';
  //************************* */
  function createJSON(nav,jsonHArr)
{
 
   jsonHArr+='{';
   for (n = 0; n< nav.length; n++) {
        jsonHArr+=createJSONHierarchyTree(nav[n],'');
        if(n+1 < nav.length)
              jsonHArr+=',';
    }
   jsonHArr+='}';
   return jsonHArr;
}
function createJSONHierarchyTree(nav,jsonHArr)
{
        //console.log(nav);
        if (nav!== null)
        { 
            
            var name=nav['suiTreeviewListItem']['text'];
            var id=nav['suiTreeviewListItem']['id'];
            var arrTypes=propertyArr[id].types;
            var child=nav['child'];
            jsonHArr+= getString(name)+':';
            if(child.length!==0)
            { 
                jsonHArr+='{'+getStringPropNode(child,arrTypes,0,arrTypes.length,'')+'}';
            }
            else
            {
                jsonHArr+='['+ getStringOfPropElement(arrTypes)+']';
            }
            
        }
        return jsonHArr;
}
function getStringPropNode(child,arrTypes,k,length,jsonHArr)
{
    if(k<length)
    {
        jsonHArr+=getString(arrTypes[k].type)+':{';
        for (j = 0; j < child.length; j++) {
            jsonHArr+=createJSONHierarchyTree(child[j],'');
            //console.log(jsonHArr);
            if(j+1 < child.length)
              jsonHArr+=',';
        }
        if(k+1 < arrTypes.length){
            jsonHArr+='},';
            jsonHArr+=getStringPropNode(child,arrTypes,k+1,length,'');
        }
        else
            jsonHArr+='}';
    }
    return jsonHArr;
}
function getStringOfPropElement(arr)
{
    var s=getString(arr[0].type);
    for (i = 1; i < arr.length; i++) {
       s += ','+getString(arr[i].type);
    }
    return s;
}
function getString(s)
{
    return '\"'+s+'\"';
}
/*********************************** */
(function() {
    'use strict';
    /**
     * Create html element
     * @param {String} storageType html element 
     * @param {Object} config
     */
    function  createElement(storageType, config) {
      const htmlElement = document.createElement(storageType);
    
      if (config === undefined) {
        return htmlElement;
      }
      
      if (config.className) {
        htmlElement.className = config.className;
      }
    
      if (config.content) {
        htmlElement.textContent = config.content;
      }
      
      if (config.children) {
        config.children.forEach((el) => {
          if (el !== null) {
            htmlElement.appendChild(el);
          }
        });
      }
    
      return htmlElement; 
    }
    
    
    /**
     * @param {Object} node
     * @return {HTMLElement}
     */
    function createExpandedElement(node) {
      const iElem = createElement('i');
      if (node.expanded) {
        iElem.className = 'fas fa-caret-down';
      } else {
        iElem.className = 'fas fa-caret-right';
      }
    
      const caretElem = createElement('div', {
        className: 'caret-icon',
        children: [iElem],
      });
    
      const handleClick = node.toggle.bind(node);
      caretElem.addEventListener('click', handleClick);
    
     /* const indexElem = createElement('div', {
        className: 'json-index',
        content: node.property,
      });
    
      const typeElem = createElement('div', {
        className: 'json-type',
        content: 'root',
      });
    */
      const propertyElem = createElement('div', {
        className: 'property',
        content: node.property,
      });
      const div_Lock =createElement('div', {
        className:  'treeLock'
      });
      const div2 =createElement('div', {
        className: 'lock unlocked'
      });
      const handleLockChange = node.LockChange.bind(node);
      div2.addEventListener('click', handleLockChange);
      div_Lock.appendChild(div2);
      const div_slider=createElement('div', {
        className: 'treeSlider'
      });
      const div3 =createElement('input', {
        className: 'theSlider'
      });
      const handleChange = node.sliderChange.bind(node);
      div3.addEventListener('click', handleChange);
      div3.setAttribute('type',"range");
      div3.setAttribute('max',100);
      div3.setAttribute('min',0);
      div3.setAttribute('value',100);
      div3.setAttribute('step',1);
      div_slider.appendChild(div3);

      const div_colorChooser =createElement('div', {
        className:  'treeColor'
      });
      const div4 =createElement('input', {
        className: 'primary_color'
      });
      div4.setAttribute('type',"color");
      div4.setAttribute('data-bind',"input");
      div4.setAttribute('value',"#808080");
      const handleColorChange = node.ColorChange.bind(node);
      div4.addEventListener('change', handleColorChange);
      div_colorChooser.appendChild(div4);
      let lineChildren;
      if( node.isroot==true )//|| node.parent.isroot==true)
      {
        //lineChildren = [caretElem,typeElem]
        lineChildren = [caretElem,propertyElem]
      }
      /*else if(node.isPropertyTree)
      {
        if (node.property === null) {
          //lineChildren = [caretElem,typeElem,div_slider]
          lineChildren = [caretElem,typeElem,div_slider]
        } else if (node.parent.storageType === 'array') {
         // lineChildren = [caretElem,indexElem];//,div_slider]
          lineChildren = [caretElem,indexElem];//,div_slider]
        } else {
          lineChildren = [caretElem,propertyElem];//,div_slider]
        }
      }*/
      else if (node.property === null) {
        //lineChildren = [caretElem,typeElem];//,div_slider,div_Lock]
        node.hasLocked=true;
        node.hasSlider=true;
        lineChildren = [caretElem,propertyElem,div_slider,div_colorChooser,div_Lock];
      } else {
        //lineChildren = [caretElem,propertyElem];//,div_slider,div_Lock]
        node.hasLocked=true;
        node.hasSlider=true;
        lineChildren = [caretElem,propertyElem,div_slider,div_colorChooser,div_Lock];
      }
    
      const lineElem = createElement('div', {
        className: 'line',
        children: lineChildren
      });
    
      if (node.depth > 0) {
        lineElem.style = 'margin-left: ' + node.depth * 20 + 'px;';
      }
      return lineElem;
    }
    
    /**
     * @param {Object} node
     * @return {HTMLElement}
     */
    function createNotExpandedElement(node) {
      const caretElem = createElement('div', {
        className: 'empty-icon',
      });
    
      const propertyElem = createElement('div', {
        className: 'property',
        content: node.property
      });
      const div_Lock =createElement('div', {
        className:  'treeLock'
      });
      const div2 =createElement('div', {
        className: 'lock unlocked'
      });
      const handleLockChange = node.LockChange.bind(node);
      div2.addEventListener('click', handleLockChange);
      div_Lock.appendChild(div2);
      const div_slider =createElement('div', {
        className: 'treeSlider'
      });
      const div3 =createElement('input', {
        className: 'theSlider'
      });
      const handleChange = node.sliderChange.bind(node);
      div3.addEventListener('click', handleChange);
      div3.setAttribute('type',"range");
      div3.setAttribute('max',100);
      div3.setAttribute('min',0);
      div3.setAttribute('value',100);
      div3.setAttribute('step',1);
      div_slider.appendChild(div3);
      var arr;
      const div_colorChooser =createElement('div', {
        className:  'treeColor'
      });
      const div4 =createElement('input', {
        className: 'primary_color'
      });
      div4.setAttribute('type',"color");
      div4.setAttribute('value',"#808080");
      const handleColorChange = node.ColorChange.bind(node);
      div4.addEventListener('change', handleColorChange);
      div4.setAttribute('data-bind',"input");
      //const handleLockChange = node.LockChange.bind(node);
      //div2.addEventListener('click', handleLockChange);
      div_colorChooser.appendChild(div4);

      /*if(node.isPropertyTree)
      {
        arr=[caretElem, propertyElem,div_slider];
      }
     else{*/
        node.hasLocked=true;
        node.hasSlider=true;
        arr=[caretElem, propertyElem,div_slider,div_colorChooser,div_Lock];
     //}
      const lineElem = createElement('div', {
        className: 'line',
        children: arr
      });
     
    
      if (node.depth > 0) {
        lineElem.style = 'margin-left: ' + node.depth * 20 + 'px;';
      }
    
      return lineElem;
    }
    
    
    /**
     * create tree node
     * @return {Object}
     */
    function createNode() {
      return {
        property: null,
        count: 0,
        value: 100,
        color:'#808080',//gray
        elem: null,
        parent: null,
        children: null,
        //count:0,
        expanded: false,
        storageType: null,
        depth: 0,
        control:null,
        HIcontrol:[],
        elementsList:[],
        isDisabled:false,
        isPropClassName:false,
        isPropertyTree:false,
        isroot:false,
        hasLocked: false,
        hasSlider: false,
        setCaretIconRight() {
          const icon = this.elem.querySelector('.fas');
          icon.classList.replace('fa-caret-down', 'fa-caret-right');
        },
    
        setCaretIconDown() {
          const icon = this.elem.querySelector('.fas');
          icon.classList.replace('fa-caret-right', 'fa-caret-down');
        },
    
        hideChildren() {
          if (this.children !== null) {
            this.children.forEach((item) => {
              item.elem.classList.add('hide');
              if (item.expanded) {
                item.hideChildren();
              }
            });
          }
        },
    
        showChildren() {
          if (this.children !== null) {
            this.children.forEach((item) => {
              item.elem.classList.remove('hide');
              if (item.expanded) {
                item.showChildren();
              }
            });
          }
        },
    
        toggle: function() {
          if (this.expanded) {
            this.expanded = false;
            this.hideChildren();
            this.setCaretIconRight();
          } else {
            this.expanded = true;
            this.showChildren();
            this.setCaretIconDown();
          }
        },
        sliderChange: function() {
          if(this.isDisabled!==true)
          {
            var prevValue=this.value;
            var currValue=getSliderCurrentValue(this);
            this.value = currValue;
            //var ratio= (this.value/this.maxValue)*100;

            /*if(this.isPropertyTree && this.HIcontrol!=[])
            {
              this.HIcontrol.forEach((item) => {
                if(isUnLocked(item)===true)
                {
                  var newValue=Math.floor(ratio*(item.maxValue/100));
                  setSliderValue(item,newValue);
                }
              });
            }
            else if(this.control!=null)
            {
              var sum=0;
              //console.log(this);
              //console.log(this.conrol.HIcontrol);
              
              this.control.HIcontrol.forEach((item) => {
                sum=sum+item.value;
              });
              setSliderValue(this.conrol,sum);
            }*/
            //if(this.parent)
            if(this.parent!==null && this.parent.hasSlider==true)
            {
              updateParentsSliderValue(this.parent);
            }

            if(this.children!==null)
            {
              updateChildrenSliderValue(this,prevValue,currValue);
            }
          }
        },
        ColorChange:function()
        {
            this.color=(getColor(this)).value;
            updateChildrenColorValue(this,this.color);
        },
        LockChange:function(){
          
          if(this.isDisabled==false)
          {

            var element = getLockElement(this);
            element.className='lock';
            var element2 = getSlider(this);
            element2.disabled=true;
            this.isDisabled=true;
            lockedChildren(this);
          }
          else
          {
            var element = getLockElement(this);
            element.className='lock unlocked';
            var element2 = getSlider(this);
            element2.disabled=false;
            this.isDisabled=false;
            unlockedParents(this.parent);
            
          }
        }
      }
    }
    function unlockedParents(node) { 
      if(node!==null && node.hasLocked==true)
      {
          var element = getLockElement(node);
          element.className='lock unlocked';
          var element2 = getSlider(node);
          element2.disabled=false;
          unlockedParents(node.parent);
      }
  }
  /*function isUnLocked(node) { 
    var element = getLockElement(node);
    if(element.className==='lock unlocked')
        return true;
    else
        return false;
  }*/
    function lockedChildren(node) { 
        if(node.children!==null)
        {
          node.children.forEach((item) => {
            var element = getLockElement(item);
            element.className='lock';
            var element2 = getSlider(item);
            element2.disabled=true;
            lockedChildren(item);
          });
        }
    }
    function getColor(node)
    {
      return node.elem.children[3].children[0];
    }
    function getLockElement(node) {
      return node.elem.children[4].children[0];
  }
      /**
       * 
       * @param {Object} obj
       */ 
      function updateParentsSliderValue(node) {
        if(node.isroot===false && node.hasSlider==true)
        {
          var sum=0;
          node.children.forEach((item) => {
            sum=sum + item.value;
          });
          sum= sum/node.children.length;
          setSliderValue(node,sum);
          updateParentsSliderValue(node.parent);
        }
        
      }
      function updateChildrenColorValue(node,colorValue)
      {
            if(node.children!==null)
            {
              node.children.forEach((item) => {
                
                if(item.isDisabled==false)
                {
                  setColorValue(item,colorValue);
                  updateChildrenColorValue(item,colorValue);
                }
              });
            }
      }
      function updateChildrenSliderValue(node,parentPrevValue,parentCurrValue)
      {
            if(node.children!==null)
            {
                var diff=parentCurrValue-parentPrevValue;
                //var diff2=diff;
                if(diff>0)
                {
                  node.children.forEach((item) => {
                    var PrevValue=item.value;
                    if(PrevValue<100 && item.isDisabled==false)
                    {
                      var ratio=(diff*PrevValue)/parentPrevValue;
                      console.log('P('+ratio+')');
                      if(PrevValue+ratio>100){
                          var rem=(PrevValue+ratio)-100;
                          setSliderValue(item,100);
                          updateChildrenSliderValue(item,PrevValue,item.value) ;
                          //diff2-=ratio;
                         // diff2+=rem;
                        }
                        else
                        {
                          setSliderValue(item,PrevValue+ratio);
                          updateChildrenSliderValue(item,PrevValue,item.value) ;
                         // diff2-=ratio;
                        }
                      }
                  });
                }
                else if(diff<0)
                {
                  node.children.forEach((item) => {
                    var PrevValue=item.value;
                    if(PrevValue>0 && item.isDisabled==false)
                    {
                      var ratio=(diff*PrevValue)/parentPrevValue;
                      console.log('N'+ratio);
                      if(PrevValue+ratio<0){
                          var rem=(PrevValue+ratio);
                          setSliderValue(item,0);
                          updateChildrenSliderValue(item,PrevValue,item.value) ;
                         // diff2-=ratio;
                        //  diff2+=rem;
                        }
                        else
                        {
                          setSliderValue(item,PrevValue+ratio);
                          updateChildrenSliderValue(item,PrevValue,item.value) ;
                         // diff2-=ratio;
                        }
                      }
                  });
                }
 
             
              /*if(diff2>0 || diff2<0)
              {
                //var d=diff-rem;
                updateChildrenSliderValue(node,parentPrevValue+(diff-diff2),parentCurrValue) ;
              }*/
            }
      }


           /**
     * Return slider value
     * @param {Object} obj
     * @return {Object}
     */ 
    function getSlider(obj) {
    //  console.log(obj);
      return (obj.elem.children[2].children[0]);
    }
    function getSliderCurrentValue(obj) {
  
      return parseInt(getSlider(obj).value);
    }
    function setColorValue(obj,newValue)
    {
      getColor(obj).value = newValue;
      obj.color=newValue;
    }
               /**
     * set slider value
     * @param {Object} obj
     */ 
    function setSliderValue(obj,newValue) {
      getSlider(obj).value = newValue;
      obj.value=newValue;
    }
               /**
     * Return slider max value
     * @param {Object} obj
     * @return {number}
     */ 
    function getSliderMaxValue(obj) {
      return parseInt(getSlider(obj).max);
    }
           /**
     * Return value
     * @param {Object} obj
     * @return {number}
     */ 
    function getSumOfChildValues(obj) {
      var sum=0;
      obj.children.forEach((item) => {
        sum=sum + item.maxValue;
      });
      return sum;
    }
    /**
     * Return object length
     * @param {Object} obj
     * @return {number}
     */
    function getLength(obj) {
      let length = 0;
      for (let property in obj) {
        length += 1;
      };
      return length;
    }
    
    
    /**
     * Return variable storageType
     * @param {*} val
     */
    function getType(val) {
      let storageType = typeof val;
      if (Array.isArray(val)) {
        storageType = 'array';
      } else if (val === null) {
        storageType = 'null';
      }
      return storageType;
    }
    
    
    /**
     * Recursively traverse json object
     * @param {Object} obj parsed json object
     * @param {Object} parent of object tree
     */
    function traverseObject(obj, parent,isPropertyTree) {
      for (let property in obj) {
        const child = createNode();
        child.isPropertyTree=isPropertyTree;
        child.parent = parent;
        child.storageType = getType(obj[property]);
        if(Array.isArray(obj))
        {
          child.property = obj[property];
        }
        else{
          child.property = property;
        }
        if(child.parent.isPropClassName!==true)
        {
           child.isPropClassName=true;
        }
        child.depth = parent.depth + 1;
        child.expanded = false;
        child.isroot=false
        if (typeof obj[property] === 'object') {
          child.children = [];
          parent.children.push(child);
          traverseObject(obj[property], child,isPropertyTree);
          /*
            child.maxValue = //  should be computed from element list
          }*/
          child.elem = createExpandedElement(child);
        } else {
          
          //child.maxValue = //  should be computed from element list
          child.elem = createNotExpandedElement(child);
          parent.children.push(child);
        }
      }
    }
    /*function getCountElementArr(properities)
    {

    }*/
    /*function getValueFromPropArr(node,_type)
    {
      var _name=node.parent.property;
      for (var i=0 ; i < propertyArr.length ; i++)
      {
          if (propertyArr[i].name == _name) {
           
              for (var j=0 ; j < propertyArr[i].types.length ; j++)
              {
                //console.log(propertyArr[i].types);
                if (propertyArr[i].types[j].type == _type) {
                  //console.log(propertyArr[i].types[j].value);
                  return propertyArr[i].types[j].value;
                }
              }
          }
      }
     
    }*/
    /**
     * Create root of a tree
     * @param {Object} obj Json object
     * @return {Object}
     */
    function createTree(obj,isPropertyTree) {
      const tree = createNode();
      tree.storageType = getType(obj);
      tree.isPropertyTree=isPropertyTree;
      tree.value = 100;
      //tree.count = nbElement;
      tree.children = [];
      tree.expanded = true;
      tree.isroot=true;
      tree.isPropClassName=false;
      traverseObject(obj, tree,isPropertyTree);
      tree.elem = createExpandedElement(tree);
      return tree;
    } 
    /**
     * Recursively traverse Tree object
     * @param {Object} node
     * @param {Callback} callback
     */
    function traverseTree(node, callback) {
      callback(node);
      if (node.children !== null) {
        node.children.forEach((item) => {
          traverseTree(item, callback);
        });
      }
    }

    /**
     * Render Treeee object
     * @param {Object} tree
     * @param {String} targetElem
     */
    function render(tree, targetElem,i) {
      let rootElem;
      if (targetElem) {
        rootElem = document.querySelectorAll(targetElem);
      } else {
        rootElem = document.body;
      }
    
      traverseTree(tree, (node) => {
        if (!node.expanded) {
          node.hideChildren();
        }
        rootElem[i].appendChild(node.elem);
      });
    }
    

   
 /* Export jsonView object */
 window.jsonView = {
  /**
   * Render JSON into DOM container
   * @param {String} jsonData
   * @param {String} targetElem
   */
  format: function(jsonData, targetElem) {
    let parsedData = jsonData;
    if (typeof jsonData === 'string' || jsonData instanceof String) 
        parsedData = JSON.parse(jsonData);
    //var numParticles=parsedData['general']['particles'];
   // console.log(parsedData);
   
    Htree = createTree(parsedData,false);
    render(Htree, targetElem,0);
    Htree.count=nbElement;
    countElementsOfthisClass(Htree,[],[]);
    //const propertyTree = createTree(parsedData['stats']['global'],numParticles,true);
    //render(propertyTree, targetElem,1);
   // connectTrees(tree,propertyTree);
    //console.log(Htree);

  }
}
function countElementsOfthisClass(node,className,problist)
{
 if(node.isPropClassName==true){
        //var count=0;
        className.push(node.property);
        node.count=countElements(className,problist);
        node.children.forEach((item) => {
          countElementsOfthisClass(item,className,problist);
        });
  }
  else if(node.children!=null)
  {
    //var count=0;
    if(node.property!=null)
    {
      problist.push(node.property);
      node.count=countElements(className,problist);
    }
    node.children.forEach((item) => {
      countElementsOfthisClass(item,className,problist);
    });
    if(node.property!=null)
      problist.pop();
  }
  else {
    
    problist.push(node.property);
    node.count=countElements(className,problist);
    problist.pop();
  }
}
function countElements(className,problist)
{
  var count=0;
  
  for(var i=0;i<nbElement;i++)
  {
    //var incCount=true;
    var AllPropExist=true;
    for(var j=0;j<problist.length;j++)
    {
      //console.log(problist);
      var propExist=false;
      for(var k=0;k<ElementArr[i].properties.length;k++)
      {
        var obj=ElementArr[i].properties[k].value;
        if (obj == problist[j]) {
          propExist=true;
          break;
        }
      }
      if(propExist==false)
      {
        AllPropExist=false;
        break;
      }
    }
    if(AllPropExist==true)
    {
      count++;
    }
  }
  return count;
}
/*function connectTrees(HItree,node)
{
    if (node !== null) {
      searchANDLink(HItree,node,node.property);
      if(node.children!=null)
      {
        node.children.forEach((child) => {
          connectTrees(HItree,child);
        });
      }

    }
}
function searchANDLink(HInode,node,property)
{
    
      if (HInode !== null) {
       
          if(HInode.property==property)
          {
            //console.log(Hnode.property);
            HInode.control=node;
            node.HIcontrol.push(HInode);
          }
          else
           {
             if (HInode.children !== null)
             {
              HInode.children.forEach((child) => {
                searchANDLink(child,node,property);
              });

             }
              
          }
      }
  
}*/
})();