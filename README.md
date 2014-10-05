jquery-lightbox
===============

This lightbox was made to give you the freedom you need. It is fully customizable with a minimum of required setup:

- you can use your own HTML + CSS
- you can use different darkness layers for all lightboxes
- you can preload the lightbox content images
- you can specify elements within the lightbox which will trigger close
- you can specify animation speed
- you can specify removal delays to get your own CSS transitions working

Additionally

- if bound to a link, the HREF-attribute is automatically used as content
- if lightbox is larger than the viewport it will be positioned absolute to allow scrolling
- click on darkness will trigger close
- pressing ESC will trigger close


Requirements
------------

- jQuery 1.8+


Configuration
-------------

You got multiple possibilities to configure the plugin's defaults:

1. Setup a global config object **before** loading the plugin: `window.config = { lightbox: { <options> } }`
2. Call the setup function: `$.lightbox({ <options> })`
3. Modify the plugin source (but keep in mind this complicates updating the plugin)


Options
-------

- **htmlLightbox** *( string | HTMLElement | jQuery )*

  The HTML of the lightbox itself.
  This must be a HTML-String, HTML-Element, jQuery-Selector or a jQuery-Collection. 

  _default_:
  ```html
  <div class="lightbox"><button name="close"></button><div class="narrow"></div></div>
  ```
- **htmlDarkness** *( string | HTMLElement | jQuery )*

  The darkness layer between your website and the lightbox.
  You may use an empty string here. In this case there will be no layer (and no click handler outside the lightbox).
  This must be a HTML-String, HTML-Element, jQuery-Selector or a jQuery-Collection.
  
  _default_:
  ```html
  <div class="darknessLayer" style="position:fixed; top:0; left:0; right:0; bottom:0;"></div>
  ```
- **selectClose** *( string )*

  Selector for elements within the lightbox which will close the lightbox on click.
  
  _default_: `button[name=close]`
- **selectContent** *( string )*

  Selector for the content container element.
   
  _default_: `.narrow`
- **content** *( string | HTMLElement | jQuery )*

  The content which will be shown.
  This must be a URL, HTML-String, HTML-Element, jQuery-Selector or a jQuery-Collection.
  If a URL is passed and server's response content-type is "*image/**", it will automatically generate an IMG-tag.
  
  _default_: `null`
- **waitForImages** *( bool )*

  If set to `true` the lightbox will wait for all images within itself to load.
  
  _default_: `true`
- **textError**: *( string )*

  The error text which is shown when a request fails.

  _default_: `'Error: The requested content is not available at the moment.'`
- **animationSpeed** *( string | number )*,

  The duration of animations. Use `0` for no animation.

  _default_: `fast`
- **delayElementRemoval** *( number )*

  If you are using CSS transitions (e.g. for fading out the lightbox), put here the same amount of seconds like for the animation.

  _default_: `0s`
- **insertMode** *( string )*

  Define if the lightbox and darkness will be appended or prepended to the body. 
  Possible values are `append` & `prepend`.
  
  _default_: `prepend`


How to use
----------

This plugin offers two ways for binding.

**I strongly recommend using data-attribute**, due this has the advantage of auto binding itself to all elements,
also if they are added later within a success callback of an ajax call (see "auto pilot").

- **via data-attribute** on links

  ```html
  <a href="path/to/my/resource.html" data-lightbox>Link</a>
  ```
  
- **via data-attribute** on other elements

  ```html
  <img src="thumbnail.jpg" alt="Some Image" data-lightbox='{ content: './fullsize.jpg' }'/>
  ```
  
- **via jQuery-Collection** on links

  ```html
  <a href="path/to/my/resource.html" class="useLightbox">Link</a>
  ```
  
  ```javascript
  $('a.useLightbox').lightbox();
  ```
  
- **via jQuery-Collection** on other elements

  ```html
  <img src="thumbnail.jpg" alt="Some Image" class="useLightbox"/>
  ```
  
  ```javascript
  $('.useLightbox').lightbox({ content: './fullsize.jpg' });
  ```
  