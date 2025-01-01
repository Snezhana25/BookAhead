document.addEventListener("DOMContentLoaded", () => {
    const roomsClose = document.getElementById("close-cards");
    const roomContainer = document.getElementById("room-container");

    const roomsModal = "rooms-modal";

    // calendar button
    const dateElement = document.getElementById("datepicker");

    const adultField = document.getElementById("num-adults");
    const childrenField = document.getElementById("num-children");
    const childrenAgeContainer = document.getElementById("children-ages");

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "block";
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "none";

            if (modal && getComputedStyle(modal).display === 'none') {
                const litepicker = document.querySelector('.litepicker');
                if (litepicker) {
                    litepicker.remove();
                }
            }
        }
    }

    function toggleButton() {
        const ageInput = childrenAgeContainer.querySelectorAll(".age-input");
        const allFieldsFilled = Array.from(ageInput).every(age => {
            const ageValue = parseInt(age.value.trim(), 10); // Convert to an integer
            return ageValue >= 0;
        }) && childrenField.value >= 0;

        if (!allFieldsFilled) {
            dateElement.disabled = true;
        } else {
            dateElement.disabled = false;
        }
    }

    dateElement.addEventListener("click", () => {
        fetchDates().then((data) => {
            setTimeout(() => {
                initializeCalendar(dateElement, data);
            }, 100);
        });
    });

    roomsClose.addEventListener("click", () => {
        closeModal(roomsModal);
    });

    function updateChildrenAgeFields(numChildren) {
        childrenAgeContainer.innerHTML = "";

        if (numChildren > 0) {
            childrenAgeContainer.style.display = "flex";

            for (let i = 0; i < numChildren; i++) {
                const label = document.createElement("label");
                label.textContent = `Child ${i + 1} Age:`;

                const input = document.createElement("input");
                input.type = "number";
                input.min = "0";
                input.max = "17";
                input.className = "age-input";
                input.dataset.childIndex = i;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'child-checkbox';
                checkbox.dataset.childIndex = i;

                const checkboxLabel = document.createElement("label");
                checkboxLabel.textContent = `Extra bed`;

                childrenAgeContainer.appendChild(label);
                childrenAgeContainer.appendChild(input);

                childrenAgeContainer.appendChild(checkbox);
                childrenAgeContainer.appendChild(checkboxLabel);
            }
        } else {
            childrenAgeContainer.style.display = "none";
        }

        toggleButton()
    }

    childrenField.addEventListener("input", () => {
        const numChildren = parseInt(childrenField.value, 10) || 0;
        updateChildrenAgeFields(numChildren);
        toggleButton();
    });

    childrenAgeContainer.addEventListener("input", () => {
        toggleButton();
    });

    adultField.addEventListener("input", () => {
        toggleButton();
    });

    function messageElement(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `<p>${message}</p>`;
        return messageElement;
    }
    
    function onInjectHeader(picker) {
        const container = picker.ui;
        if (!container.querySelector('.litepicker-header')) {
            const header = document.createElement('div');
            header.classList.add('litepicker-header');
            header.innerHTML = `
            <h3 class="litepicker-title">Choose dates</h3>
            <button class="litepicker-close">&times;</button>`;
            container.prepend(header);

            const closeButton = header.querySelector('.litepicker-close');
            closeButton.addEventListener('click', () => picker.hide());
        }
    }

    function disableCalendarApplyBtn(picker, startDate, endDate) {
        const applyButton = picker.ui.querySelector('.button-apply');

        if (startDate && endDate) {
            applyButton.disabled = false;
        } else {
            applyButton.disabled = true;
        }
    }

    function initializeCalendar(data, availableDates) {
        const picker = new Litepicker({
            element: data,
            singleMode: false,
            format: "YYYY-MM-DD",
            numberOfMonths: 2,
            numberOfColumns: 2,
            minDate: new Date(),
            minDays: 2,
            autoApply: false,
            autoRefresh: true,
            position: "center",
            parentEl: "#litepicker-container",
            todayButton: true,
            setup: (picker) => {
                picker.on('render', () => {
                    handlePriceTips(picker, availableDates);
                    onInjectHeader(picker);
                    disableCalendarApplyBtn(picker);
                });
                picker.on('button:apply', (start, end) => {
                    const checkin = start.format('YYYY-MM-DD');
                    const checkout = end.format('YYYY-MM-DD');
                    fetchRooms(checkin, checkout);
                });
                picker.on('change:month', () => {
                    handlePriceTips(picker, availableDates);
                });
                picker.on('preselect', (startDate, endDate) => {
                    disableCalendarApplyBtn(picker, startDate, endDate);
                });
                picker.on('hide', () => {
                    const header = picker.ui.querySelector('.litepicker-header');
                    const litepicker = document.querySelector('.litepicker');

                    if (header) {
                        header.remove();
                    }
                    if (litepicker) {
                        litepicker.remove();
                    }
                });
            },
        });

        picker.show();

        const litepicker = document.querySelector(".litepicker");

        if (litepicker) {
            litepicker.style.position = "relative";
            litepicker.classList.add('update-styles');
        }

        return picker;
    }

    function handlePriceTips(picker, availableDates) {
        const dateElements = picker.ui.querySelectorAll('.day-item');

        if (availableDates.length === 0) {
            return;
        }

        dateElements.forEach(dateElement => {
            const dateTimestamp = dateElement.getAttribute('data-time');

            if (dateTimestamp) {
                let matchingItem = null;
                const timestamp = parseInt(dateTimestamp, 10);
                const date = new Date(timestamp);

                //Format the current date in the format 'YYYY-MM-DD'
                //This approach allows you to compare only days without time, which is necessary in this case for correct logic.
                const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
                    .toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

                matchingItem = availableDates.find(item => item.date === formattedDate);
                if (matchingItem) {
                    setTimeout(() => {
                        if (matchingItem.cheapest === true) {
                            dateElement.style.color = 'green';
                        } else if (matchingItem.cheapest === false) {
                            dateElement.style.color = '#f44336';
                        }
                    }, 100);
                }
            }
        });
    }

    function getMinMaxPrices(hotelQuotes) {
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        hotelQuotes.forEach((room) => {
            const roomPrice = room.fullPriceBreakdown?.adult_price_per_night;
            if (roomPrice !== undefined && roomPrice !== null) {
                minPrice = Math.min(minPrice, roomPrice);
                maxPrice = Math.max(maxPrice, roomPrice);
            }
        });

        return { minPrice, maxPrice };
    }

    // Adding a price comparison indicator for 1 night for an adult
    function getPrice(roomPrice, minPrice, maxPrice) {
        const lowPrice = String.fromCodePoint(0x1F525);
        const highPrice = String.fromCodePoint(0x1F51D);

        if (roomPrice === maxPrice) {
            return `<span class="high-price">${highPrice}</span>`;
        } else {
            return `<span class="low-price">${lowPrice}</span>`;
        }
    }

    async function fetchDates() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year + 1}-${month}-01`; // 6 months

        const adults = parseInt(adultField.value, 10) || 0;
        const children = parseInt(childrenField.value, 10) || 0;
        const childrenAges = Array.from(
            childrenAgeContainer.querySelectorAll(".age-input")
        ).map((input) => parseInt(input.value, 10) || 0);

        const party = {
            adults: adults,
            children: childrenAges.slice(0, children),
        };

        const url = `https://api.travelcircus.net/hotels/17080/checkins?party=${encodeURIComponent(
            JSON.stringify(party)
        )}&domain=de&date_start=${startDate}&date_end=${endDate}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data._embedded.hotel_availabilities || [];
        } catch (error) {
            console.error("Error fetching availability:", error);
            return [];
        }
    }

    function newRoomData(room) {
        return {
            name: room.name || "Unnamed Room",
            description: room._embedded?.addons[0].description_long || room.description || "No description available",
            price: room.full_formatted_price || "Price not available",
            adult_price_per_night: room.fullPriceBreakdown?.adult_price_per_night,
            image: room._embedded?.pictures?.[0]?.["2col_teaser_big"] || "No image available",
            alt_text: room._embedded?.pictures?.[0]?.alt_text,
            capacity: {
                adults: room.base_capacity || 0,
                children: room.max_children || 0,
            },
            amenities: room._embedded?.amenities,
            extra_bed_age_ranges: room._embedded?.extra_bed_age_ranges,

            size: room.room_size_min && room.room_size_max
                ? `${room.room_size_min}-${room.room_size_max} m²`
                : "Size not specified",
        };
    }

    function renderCard(roomData, priceEmoji, hotelQuotes, numAdults, childrenAges) {
        const amenitiesList = roomData.amenities
            ? `<ul class="amenities-list">${roomData.amenities
                .map(amenities => `<li class="amenity-item">${amenities.description}</li>`)
                .join("")}</ul>`
            : "<p>No amenities available</p>";

        const roomCard = document.createElement("div");
        roomCard.classList.add("card-room");
        roomCard.innerHTML = `
            <div class="img-container">
                 <img src="${roomData.image}" alt="${roomData.alt_text}" class="room-image">
             </div>
             <h3>${roomData.name}</h3>
             <p>Price: ${roomData.price} <span>${hotelQuotes.length > 1 ? priceEmoji : ""}</span></p>
             <div class="amenities-container">${amenitiesList}</div>`;

        return canAskExtraBed(roomData, numAdults, childrenAges)
            ? roomCard
            : messageElement(`We couldn't find a suitable room for you`);
    }

    function renderRoomContainer(hotelQuotes, checkin, checkout, numAdults, childrenAges) {

        const calculateNights = (checkin, checkout) => {
            const checkinD = new Date(checkin);
            const checkoutD= new Date(checkout);
            const timeDifference = checkinD - checkoutD;
            const nights = timeDifference / (1000 * 3600 * 24);
            return nights;
        };

        roomContainer.innerHTML = "";
        const { minPrice, maxPrice } = getMinMaxPrices(hotelQuotes);

        hotelQuotes.forEach(room => {
            const roomData = newRoomData(room);
            const priceEmoji = getPrice(roomData.adult_price_per_night, minPrice, maxPrice);
            roomContainer.appendChild(renderCard(roomData, priceEmoji, hotelQuotes, numAdults, childrenAges));

        });

        const title = `<h2 class="title">Available room${hotelQuotes.length > 1 ? 's' : ''}</h2>`;
        const selectedDate = `${checkin} - ${checkout} (${calculateNights(checkin, checkout)} night${calculateNights(checkin, checkout) !== 1 ? 's' : ''})`;
        roomContainer.insertAdjacentHTML("afterbegin", `<div>${title} <div class="selected-date">${selectedDate}</div></div>`);
    }

    function canAskExtraBed(room, numAdults, childrenAges) {
        const maxCapacity = room.capacity.adults + room.capacity.children;
        const extraBedRanges = room.extra_bed_age_ranges || [];

        if (numAdults + childrenAges.length <= maxCapacity) {
            const isEligibleForExtraBed = childrenAges.some(childAge => {
                return extraBedRanges.some(range => {
                    const minAge = range.min_age ?? 0;
                    const maxAge = range.max_age ?? 17;
                    return childAge >= minAge && childAge <= maxAge;
                });
            });

            return isEligibleForExtraBed;
        }

        return false;
    }

    function fetchRooms(checkin, checkout) {
        const numAdults = parseInt(adultField.value, 10) || 0;

        const childrenAges = Array.from(
            childrenAgeContainer.querySelectorAll(".age-input")
        ).map((input) => parseInt(input.value, 10) || 0);

        const url = `https://api.travelcircus.net/hotels/17080/quotes?locale=de_DE&checkin=${checkin}&checkout=${checkout}&party=${encodeURIComponent(
            JSON.stringify({ adults: numAdults, children: childrenAges })
        )}&domain=de`;

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                const hotelQuotes = data._embedded?.hotel_quotes || [];
                roomContainer.innerHTML = "";

                if (hotelQuotes.length > 0) {
                    renderRoomContainer(hotelQuotes, checkin, checkout, numAdults, childrenAges);
                } else {
                    const message = document.createElement("div");
                    message.classList.add("message");

                    const errorMessage = data.error?.message || "No available rooms for the selected dates.";
                    roomContainer.appendChild(messageElement(errorMessage));
                }

                openModal(roomsModal);
            })
            .catch((error) => {
                roomContainer.innerHTML = "<p>Something wrong. Please try again later.</p>";
                openModal(roomsModal);
            });
    }
});
