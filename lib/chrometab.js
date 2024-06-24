import Draggabilly from "draggabilly"
const TAB_CONTENT_MARGIN = 9
const TAB_CONTENT_OVERLAP_DISTANCE = 1

const TAB_OVERLAP_DISTANCE = (TAB_CONTENT_MARGIN * 2) + TAB_CONTENT_OVERLAP_DISTANCE

const TAB_CONTENT_MIN_WIDTH = 24
const TAB_CONTENT_MAX_WIDTH = 240

const TAB_SIZE_SMALL = 84
const TAB_SIZE_SMALLER = 60
const TAB_SIZE_MINI = 48

const noop = _ => { }

const closest = (value, array) => {
    let closest = Infinity
    let closestIndex = -1

    array.forEach((v, i) => {
        if (Math.abs(value - v) < closest) {
            closest = Math.abs(value - v)
            closestIndex = i
        }
    })

    return closestIndex
}

const tabTemplate = `
    <div class="chrome-tab">
      <div class="chrome-tab-dividers"></div>
      <div class="chrome-tab-background">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><symbol id="chrome-tab-geometry-left" viewBox="0 0 214 36"><path d="M17 0h197v36H0v-2c4.5 0 9-3.5 9-8V8c0-4.5 3.5-8 8-8z"/></symbol><symbol id="chrome-tab-geometry-right" viewBox="0 0 214 36"><use xlink:href="#chrome-tab-geometry-left"/></symbol><clipPath id="crop"><rect class="mask" width="100%" height="100%" x="0"/></clipPath></defs><svg width="52%" height="100%"><use xlink:href="#chrome-tab-geometry-left" width="214" height="36" class="chrome-tab-geometry"/></svg><g transform="scale(-1, 1)"><svg width="52%" height="100%" x="-100%" y="0"><use xlink:href="#chrome-tab-geometry-right" width="214" height="36" class="chrome-tab-geometry"/></svg></g></svg>
      </div>
      <div class="chrome-tab-content">
        <div class="chrome-tab-favicon"></div>
        <div class="chrome-tab-title"></div>
        <div class="chrome-tab-drag-handle"></div>
        <div class="chrome-tab-close"></div>
      </div>
    </div>
  `

const defaultTapProperties = {
    title: 'New tab',
    favicon: false
}

let instanceId = 0

export class ChromeTabs {
    static draggabillies = [];
    static tabs = [];
    constructor() {
        this.draggabillies = [];
        this.tabs = [];
    }

    static init(el) {
        this.el = el

        this.instanceId = instanceId
        this.el.setAttribute('data-chrome-tabs-instance-id', this.instanceId)
        instanceId += 1

        this.setupCustomProperties()
        this.setupStyleEl()
        this.setupEvents()
        this.layoutTabs()
        this.setupDraggabilly()
    }

    static emit(eventName, data) {
        this.el.dispatchEvent(new CustomEvent(eventName, { detail: data }))
    }

    static setupCustomProperties() {
        this.el.style.setProperty('--tab-content-margin', `${TAB_CONTENT_MARGIN}px`)
    }

    static setupStyleEl() {
        this.styleEl = document.createElement('style')
        this.el.appendChild(this.styleEl)
    }

    static setupEvents() {
        window.addEventListener('resize', _ => {
            this.cleanUpPreviouslyDraggedTabs()
            this.layoutTabs()
        })

        this.el.addEventListener('dblclick', event => {
            if ([this.el, this.tabContentEl].includes(event.target)) this.addTab()
        })

        this.tabEls.forEach((tabEl) => this.setTabCloseEventListener(tabEl))
    }

    static get tabEls() {
        return Array.prototype.slice.call(this.el.querySelectorAll('.chrome-tab'))
    }

    static get tabContentEl() {
        return this.el.querySelector('.chrome-tabs-content')
    }

    static get tabContentWidths() {
        const numberOfTabs = this.tabEls.length
        const tabsContentWidth = this.tabContentEl.clientWidth
        const tabsCumulativeOverlappedWidth = (numberOfTabs - 1) * TAB_CONTENT_OVERLAP_DISTANCE
        const targetWidth = (tabsContentWidth - (2 * TAB_CONTENT_MARGIN) + tabsCumulativeOverlappedWidth) / numberOfTabs
        const clampedTargetWidth = Math.max(TAB_CONTENT_MIN_WIDTH, Math.min(TAB_CONTENT_MAX_WIDTH, targetWidth))
        const flooredClampedTargetWidth = Math.floor(clampedTargetWidth)
        const totalTabsWidthUsingTarget = (flooredClampedTargetWidth * numberOfTabs) + (2 * TAB_CONTENT_MARGIN) - tabsCumulativeOverlappedWidth
        const totalExtraWidthDueToFlooring = tabsContentWidth - totalTabsWidthUsingTarget

        // TODO - Support tabs with different widths / e.g. "pinned" tabs
        const widths = []
        let extraWidthRemaining = totalExtraWidthDueToFlooring
        for (let i = 0; i < numberOfTabs; i += 1) {
            const extraWidth = flooredClampedTargetWidth < TAB_CONTENT_MAX_WIDTH && extraWidthRemaining > 0 ? 1 : 0
            widths.push(flooredClampedTargetWidth + extraWidth)
            if (extraWidthRemaining > 0) extraWidthRemaining -= 1
        }

        return widths
    }

    static get tabContentPositions() {
        const positions = []
        const tabContentWidths = this.tabContentWidths

        let position = TAB_CONTENT_MARGIN
        tabContentWidths.forEach((width, i) => {
            const offset = i * TAB_CONTENT_OVERLAP_DISTANCE
            positions.push(position - offset)
            position += width
        })

        return positions
    }

    static get tabPositions() {
        const positions = []

        this.tabContentPositions.forEach((contentPosition) => {
            positions.push(contentPosition - TAB_CONTENT_MARGIN)
        })

        return positions
    }

    static layoutTabs() {
        const tabContentWidths = this.tabContentWidths

        this.tabEls.forEach((tabEl, i) => {
            const contentWidth = tabContentWidths[i]
            const width = contentWidth + (2 * TAB_CONTENT_MARGIN)

            tabEl.style.width = width + 'px'
            tabEl.removeAttribute('is-small')
            tabEl.removeAttribute('is-smaller')
            tabEl.removeAttribute('is-mini')

            if (contentWidth < TAB_SIZE_SMALL) tabEl.setAttribute('is-small', '')
            if (contentWidth < TAB_SIZE_SMALLER) tabEl.setAttribute('is-smaller', '')
            if (contentWidth < TAB_SIZE_MINI) tabEl.setAttribute('is-mini', '')
        })

        let styleHTML = ''
        this.tabPositions.forEach((position, i) => {
            styleHTML += `
          .chrome-tabs[data-chrome-tabs-instance-id="${this.instanceId}"] .chrome-tab:nth-child(${i + 1}) {
            transform: translate3d(${position}px, 0, 0)
          }
        `
        })
        this.styleEl.innerHTML = styleHTML
    }

    static createNewTabEl() {
        const div = document.createElement('div')
        div.innerHTML = tabTemplate
        return div.firstElementChild
    }

    static addTab(tabProperties, { animate = true, background = false } = {}) {
        const tabEl = this.createNewTabEl()

        if (animate) {
            tabEl.classList.add('chrome-tab-was-just-added')
            setTimeout(() => tabEl.classList.remove('chrome-tab-was-just-added'), 500)
        }

        tabProperties = Object.assign({}, defaultTapProperties, tabProperties)
        this.tabContentEl.appendChild(tabEl)
        this.setTabCloseEventListener(tabEl)
        this.updateTab(tabEl, tabProperties)
        this.emit('tabAdd', { tabEl })
        if (!background) this.setCurrentTab(tabEl)
        this.cleanUpPreviouslyDraggedTabs()
        this.layoutTabs()
        this.setupDraggabilly()
        this.tabs.push({
            ul: tabEl,
            content: tabProperties.content
        })
        return tabEl;
    }

    static setTabCloseEventListener(tabEl) {
        tabEl.querySelector('.chrome-tab-close').addEventListener('click', _ => this.removeTab(tabEl))
    }

    static get activeTabEl() {
        return this.el.querySelector('.chrome-tab[active]')
    }

    static hasActiveTab() {
        return !!this.activeTabEl
    }

    static setCurrentTab(tabEl, pop) {
        const activeTabEl = this.activeTabEl
        if (activeTabEl === tabEl) return
        if (activeTabEl) activeTabEl.removeAttribute('active')
        tabEl.setAttribute('active', '')
        this.emit('activeTabChange', { tabEl })
        const elementToFind = this.tabs.find(item => item.ul === tabEl);
        if (elementToFind != null) {
            if (!pop) {
                elementToFind.content.Focus();
            }
        }
    }

    static removeTab(tabEl) {
        let existingTabIndex = this.tabs.findIndex(tab => tab.ul === tabEl);
        if (existingTabIndex !== -1) {
            const elementToFind = this.tabs[existingTabIndex];
            if (elementToFind != null) {
                var $t;
                if (!this.Dirty) {
                    if (tabEl === this.activeTabEl) {
                        if (tabEl.nextElementSibling) {
                            this.setCurrentTab(tabEl.nextElementSibling);
                        } else if (tabEl.previousElementSibling) {
                            this.setCurrentTab(tabEl.previousElementSibling)
                        }
                    }
                    if (tabEl != null & tabEl.parentNode != null) {
                        tabEl.parentNode.removeChild(tabEl)
                        this.emit('tabRemove', { tabEl })
                    }
                    elementToFind.content.Dispose();
                    return;
                }
                elementToFind.content._confirm = ($t = new Core.Components.Forms.ConfirmDialog(), $t.Content = "Do you want to save the data before closing?", $t.OpenEditForm = elementToFind.content, $t.TabEditor = elementToFind.content.TabEditor, $t);
                elementToFind.content._confirm.YesConfirmed = Bridge.fn.combine(elementToFind.content._confirm.YesConfirmed, Bridge.fn.bind(this, function () {
                    var $step = 0,
                        $task1,
                        $taskResult1,
                        $jumpFromFinally,
                        $asyncBody = Bridge.fn.bind(this, function () {
                            for (; ;) {
                                $step = System.Array.min([0, 1], $step);
                                switch ($step) {
                                    case 0: {
                                        $task1 = elementToFind.content._confirm.OpenEditForm.Save();
                                        $step = 1;
                                        if ($task1.isCompleted()) {
                                            continue;
                                        }
                                        $task1.continue($asyncBody);
                                        return;
                                    }
                                    case 1: {
                                        $taskResult1 = $task1.getAwaitedResult();
                                        if (tabEl === this.activeTabEl) {
                                            if (tabEl.nextElementSibling) {
                                                this.setCurrentTab(tabEl.nextElementSibling);
                                            } else if (tabEl.previousElementSibling) {
                                                this.setCurrentTab(tabEl.previousElementSibling)
                                            }
                                        }
                                        if (tabEl != null & tabEl.parentNode != null) {
                                            tabEl.parentNode.removeChild(tabEl)
                                            this.emit('tabRemove', { tabEl })
                                        }
                                        elementToFind.content._confirm.OpenEditForm.Dispose();
                                        elementToFind.content._confirm.Dispose();
                                        return;
                                    }
                                    default: {
                                        return;
                                    }
                                }
                            }
                        }, arguments);
                    $asyncBody();
                }));
                this._confirm.NoConfirmed = Bridge.fn.combine(this._confirm.NoConfirmed, Bridge.fn.bind(this, function () {
                    this._confirm.OpenEditForm.Dispose();
                    this._confirm.Dispose();
                }));
                this._confirm.IgnoreCancelButton = true;
                this._confirm.Render();
            }
        }
        this.cleanUpPreviouslyDraggedTabs()
        this.layoutTabs()
        this.setupDraggabilly()
    }

    static updateTab(tabEl, tabProperties) {
        tabEl.querySelector('.chrome-tab-title').textContent = tabProperties.title

        const faviconEl = tabEl.querySelector('.chrome-tab-favicon')
        if (tabProperties.favicon) {
            if (tabProperties.favicon.includes('fa-')) {
                faviconEl.className = tabProperties.favicon;
            }
            else {
                faviconEl.style.backgroundImage = `url('${tabProperties.favicon}')`
            }
            faviconEl.removeAttribute('hidden', '')
        } else {
            faviconEl.setAttribute('hidden', '')
            faviconEl.removeAttribute('style')
        }

        if (tabProperties.id) {
            tabEl.setAttribute('data-tab-id', tabProperties.id)
        }
    }

    static cleanUpPreviouslyDraggedTabs() {
        this.tabEls.forEach((tabEl) => tabEl.classList.remove('chrome-tab-was-just-dragged'))
    }

    static setupDraggabilly() {
        const tabEls = this.tabEls
        const tabPositions = this.tabPositions

        if (this.isDragging) {
            this.isDragging = false
            this.el.classList.remove('chrome-tabs-is-sorting')
            this.draggabillyDragging.element.classList.remove('chrome-tab-is-dragging')
            this.draggabillyDragging.element.style.transform = ''
            this.draggabillyDragging.dragEnd()
            this.draggabillyDragging.isDragging = false
            this.draggabillyDragging.positionDrag = noop // Prevent Draggabilly from updating tabEl.style.transform in later frames
            this.draggabillyDragging.destroy()
            this.draggabillyDragging = null
        }

        this.draggabillies.forEach(d => d.destroy())

        tabEls.forEach((tabEl, originalIndex) => {
            const originalTabPositionX = tabPositions[originalIndex]
            const draggabilly = new Draggabilly(tabEl, {
                axis: 'x',
                handle: '.chrome-tab-drag-handle',
                containment: this.tabContentEl
            })

            this.draggabillies.push(draggabilly)

            draggabilly.on('pointerDown', _ => {
                this.setCurrentTab(tabEl)
            })

            draggabilly.on('dragStart', _ => {
                this.isDragging = true
                this.draggabillyDragging = draggabilly
                tabEl.classList.add('chrome-tab-is-dragging')
                this.el.classList.add('chrome-tabs-is-sorting')
            })

            draggabilly.on('dragEnd', _ => {
                this.isDragging = false
                const finalTranslateX = parseFloat(tabEl.style.left, 10)
                tabEl.style.transform = `translate3d(0, 0, 0)`

                // Animate dragged tab back into its place
                requestAnimationFrame(_ => {
                    tabEl.style.left = '0'
                    tabEl.style.transform = `translate3d(${finalTranslateX}px, 0, 0)`

                    requestAnimationFrame(_ => {
                        tabEl.classList.remove('chrome-tab-is-dragging')
                        this.el.classList.remove('chrome-tabs-is-sorting')

                        tabEl.classList.add('chrome-tab-was-just-dragged')

                        requestAnimationFrame(_ => {
                            tabEl.style.transform = ''

                            this.layoutTabs()
                            this.setupDraggabilly()
                        })
                    })
                })
            })

            draggabilly.on('dragMove', (event, pointer, moveVector) => {
                // Current index be computed within the event since it can change during the dragMove
                const tabEls = this.tabEls
                const currentIndex = tabEls.indexOf(tabEl)

                const currentTabPositionX = originalTabPositionX + moveVector.x
                const destinationIndexTarget = closest(currentTabPositionX, tabPositions)
                const destinationIndex = Math.max(0, Math.min(tabEls.length, destinationIndexTarget))

                if (currentIndex !== destinationIndex) {
                    this.animateTabMove(tabEl, currentIndex, destinationIndex)
                }
            })
        })
    }

    static animateTabMove(tabEl, originIndex, destinationIndex) {
        if (destinationIndex < originIndex) {
            tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex])
        } else {
            tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex + 1])
        }
        this.emit('tabReorder', { tabEl, originIndex, destinationIndex })
        this.layoutTabs()
    }
}