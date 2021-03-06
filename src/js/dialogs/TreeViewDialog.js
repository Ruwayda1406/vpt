// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/TreeViewDialog.json

class TreeViewDialog extends AbstractDialog {

constructor(options) {
    super(UISPECS.TreeViewDialog, options);
    this._handleCreateTreeButton=this._handleCreateTreeButton.bind(this);
    this._binds.createTreeButton.addEventListener('click', this._handleCreateTreeButton);
}

_handleCreateTreeButton = function() {
   fetch('data_schema.json')
    .then((res)=> { return res.text();})
    .then((data) => { jsonView.format(data, '.root'); })
    .catch((err) => {  console.log(err); })

}
}
(function() {
    'use strict';
    /**
     * Create html element
     * @param {String} type html element 
     * @param {Object} config
     */
    function  createElement(type, config) {
      const htmlElement = document.createElement(type);
    
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
    
      const indexElem = createElement('div', {
        className: 'json-index',
        content: node.key,
      });
    
      const typeElem = createElement('div', {
        className: 'json-type',
        content: "Scene",
      });
    
      const keyElem = createElement('div', {
        className: 'json-key',
        content: node.key,
      });

      node.value = getSumOfChildValues(node);
      /*if (node.parent !== null) {
        if(values[node.key]!== undefined){
          node.value = values[node.key];
        }
        else{
          node.value = getSumOfChildValues(node);
        }
      }*/

      /*const div2 =createElement('div', {
        className: 'slider'
      });
      const handleChange = node.sliderChange.bind(node);
      div2.addEventListener('click', handleChange);
      div2.setAttribute('max',node.value);
      div2.setAttribute('min',0);
      div2.setAttribute('value',0);
      div2.setAttribute('step',1);
      const div3 = createElement('div', {
        className: 'container'
      });
      div3.setAttribute('data-bind',"container");
      const div4 =createElement('div', {
        className: 'track'
      });
      const div5 =createElement('div', {
        className: 'button'
      });
      div5.setAttribute('data-bind',"button");
      div5.setAttribute('style',"margin-left: 50%;");
      div3.appendChild(div4);
      div3.appendChild(div5);
      div2.appendChild(div3);
      

      */
      const div2 =createElement('div', {
        className: 'treeSlider'
      });
      const div3 =createElement('input', {
        className: 'theSlider'
      });
      const handleChange = node.sliderChange.bind(node);
      div3.addEventListener('click', handleChange);
      div3.setAttribute('type',"range");
      div3.setAttribute('max',node.value);
      div3.setAttribute('min',0);
      div3.setAttribute('value',node.value);
      div3.setAttribute('step',1);
      div2.appendChild(div3);

      let lineChildren;
      if (node.key === null) {
        lineChildren = [caretElem, typeElem,div2]
      } else if (node.parent.type === 'array') {
        lineChildren = [caretElem, indexElem,div2]
      } else {
        lineChildren = [caretElem, keyElem,div2]
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
    
      const keyElem = createElement('div', {
        className: 'json-key',
        content: node.key
      });
     /* const div2 =createElement('div', {
        className: 'slider'
      });
      const handleChange = node.sliderChange.bind(node);
      div2.addEventListener('click', handleChange);
      div2.setAttribute('max',node.value);
      div2.setAttribute('min',0);
      div2.setAttribute('value',0);
      div2.setAttribute('step',1);

      const div3 = createElement('div', {
        className: 'container'
      });
      div3.setAttribute('data-bind',"container");
      const div4 =createElement('div', {
        className: 'track'
      });
      const div5 =createElement('div', {
        className: 'button'
      });
      div5.setAttribute('data-bind',"button");
      div5.setAttribute('style',"margin-left: 50%;");
      div3.appendChild(div4);
      div3.appendChild(div5);
      div2.appendChild(div3);
            <div class="checkbox">
    <div class="handle" data-bind="handle"></div>
</div>*/

      
      /*div5.setAttribute('type','checkbox');
      div5.setAttribute('checked','checked');
      div4.appendChild(div5);
      */
      //div4.setAttribute('data-tt-type','lock');
      //div4.setAttribute('data-tt-size','mini');
      const div2 =createElement('div', {
        className: 'treeSlider'
      });
      const div3 =createElement('input', {
        className: 'theSlider'
      });
      const handleChange = node.sliderChange.bind(node);
      div3.addEventListener('click', handleChange);
      div3.setAttribute('type',"range");
      div3.setAttribute('max',node.value);
      div3.setAttribute('min',0);
      div3.setAttribute('value',node.value);
      div3.setAttribute('step',1);
      //div2.appendChild(div4);
      div2.appendChild(div3);
      const lineElem = createElement('div', {
        className: 'line',
        //children: [caretElem, keyElem, separatorElement, valueElement,div2]
        children: [caretElem, keyElem,div2]
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
        key: null,
        parent: null,
        value: null,
        expanded: false,
        type: null,
        children: null,
        elem: null,
        depth: 0,
    
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
        CheckboxChange : function(){
            console.log('hi');
        },
        sliderChange: function() {
          var maxValue = getSliderCurrentValue(this);
          var currentValue= getSliderCurrentValue(this);
          updateParentsSliderValue(this.parent);
          if(this.children!==null)
          {
            var sumOfChildren=0;
            this.children.forEach((item) => {
              sumOfChildren=sumOfChildren + getSliderCurrentValue(item);
            });
            var diff=currentValue-sumOfChildren;
            if(diff>0){
              increaseChildrenSliderValue(this,diff);
            }
            else
            {
              decreaseChildrenSliderValue(this,diff*-1);
            }
          }
        }
      }
    }
  
      /**
       * 
       * @param {Object} obj
       */ 
      function updateParentsSliderValue(node) {
        if(node===null)
          return ;
        var sum=0;
        node.children.forEach((item) => {
          sum=sum + getSliderCurrentValue(item);
        });
        setSliderValue(node,sum);
        updateParentsSliderValue(node.parent);
      }
  
      function decreaseChildrenSliderValue(node,counter) {
        if(node.children!==null)
         {
          while(counter>0)
          {
            var i = Math.floor(Math.random() * node.children.length); 
            var v= getSliderCurrentValue(node.children[i]);
            if (v!==0)
            {
              setSliderValue(node.children[i],v-1);
              decreaseChildrenSliderValue(node.children[i],1);
              counter=counter-1;
            }
          }
        }
      }
      function increaseChildrenSliderValue(node,counter) {
        if(node.children!==null)
        {
          while(counter>0)
          {
            var i = Math.floor(Math.random() * node.children.length);
            var v= getSliderCurrentValue(node.children[i]);
            if (v!==getSliderMaxValue(node.children[i]))
            {
              setSliderValue(node.children[i],v+1);
              increaseChildrenSliderValue(node.children[i],1);
              counter=counter-1;
            }
          }
        }
      }

    /**
     * 
     * @param {Object} obj
     */ 
    function updateParentsSliderValue(node) {
      if(node===null)
        return ;
      var sum=0;
      node.children.forEach((item) => {
        sum=sum + getSliderCurrentValue(item);
      });
      setSliderValue(node,sum);
      updateParentsSliderValue(node.parent);
    }

  
           /**
     * Return slider value
     * @param {Object} obj
     * @return {number}
     */ 
    function getSliderCurrentValue(obj) {
      return parseInt(obj.elem.children[2].children[0].value);
    }
               /**
     * set slider value
     * @param {Object} obj
     */ 
    function setSliderValue(obj,newValue) {
      obj.elem.children[2].children[0].value = newValue;
    }
               /**
     * Return slider max value
     * @param {Object} obj
     * @return {number}
     */ 
    function getSliderMaxValue(obj) {
      return parseInt(obj.elem.children[2].children[0].max);
    }
           /**
     * Return value
     * @param {Object} obj
     * @return {number}
     */ 
    function getSumOfChildValues(obj) {
      var sum=0;
      obj.children.forEach((item) => {
        sum=sum + item.value;
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
      for (let key in obj) {
        length += 1;
      };
      return length;
    }
    
    
    /**
     * Return variable type
     * @param {*} val
     */
    function getType(val) {
      let type = typeof val;
      if (Array.isArray(val)) {
        type = 'array';
      } else if (val === null) {
        type = 'null';
      }
      return type;
    }
    
    
    /**
     * Recursively traverse json object
     * @param {Object} obj parsed json object
     * @param {Object} parent of object tree
     */
    function traverseObject(obj, parent) {
      for (let key in obj) {
        const child = createNode();
        child.parent = parent;
        child.key = key;
        child.type = getType(obj[key]);
        child.depth = parent.depth + 1;
        child.expanded = false;
    
        if (typeof obj[key] === 'object') {
          child.children = [];
          parent.children.push(child);
          traverseObject(obj[key], child);
          child.elem = createExpandedElement(child);
        } else {
          child.value = obj[key];
          child.elem = createNotExpandedElement(child);
          parent.children.push(child);
        }
      }
    }

    /**
     * Create root of a tree
     * @param {Object} obj Json object
     * @return {Object}
     */
    function createTree(obj,numParticles) {
      const tree = createNode();
      tree.type = getType(obj);
      tree.value = numParticles;
      tree.children = [];
      tree.expanded = true;
      traverseObject(obj, tree);
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
    function render(tree, targetElem) {
      let rootElem;
      if (targetElem) {
        rootElem = document.querySelector(targetElem);
      } else {
        rootElem = document.body;
      }
    
      traverseTree(tree, (node) => {
        if (!node.expanded) {
          node.hideChildren();
        }
        rootElem.appendChild(node.elem);
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
        if (typeof jsonData === 'string' || jsonData instanceof String) parsedData = JSON.parse(jsonData);
        var numParticles=parsedData['general']['particles'];
        const tree = createTree(parsedData['stats']['global'],numParticles);
        render(tree, targetElem);
        //console.log(tree);
      }
    }
    })();
    